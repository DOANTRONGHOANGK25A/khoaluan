import { Router } from "express";
import { pool } from "../src/db.js";
import { chainRead } from "../services/fabricDiploma.js";
import { computeRecordHashByDiplomaId } from "../services/recordHash.js";

const router = Router();

// GET /api/public/verify?serialNo=VB001  hoặc  ?studentId=SV001  hoặc  ?studentName=Nguyen
router.get("/verify", async (req, res, next) => {
    try {
        const serialNo = (req.query.serialNo || "").trim();
        const studentId = (req.query.studentId || "").trim();
        const studentName = (req.query.studentName || "").trim();

        if (!serialNo && !studentId && !studentName) {
            return res.status(400).json({ ok: false, message: "serialNo, studentId, or studentName required" });
        }

        // Tìm danh sách diplomas theo loại query
        let rows = [];
        if (serialNo) {
            const r = await pool.query(
                "SELECT id, serial_no, student_id, student_name, status FROM diplomas WHERE serial_no=$1",
                [serialNo]
            );
            rows = r.rows;
        } else if (studentId) {
            const r = await pool.query(
                "SELECT id, serial_no, student_id, student_name, status FROM diplomas WHERE student_id=$1 LIMIT 20",
                [studentId]
            );
            rows = r.rows;
        } else {
            const r = await pool.query(
                "SELECT id, serial_no, student_id, student_name, status FROM diplomas WHERE lower(student_name) LIKE $1 LIMIT 20",
                [`%${studentName.toLowerCase()}%`]
            );
            rows = r.rows;
        }

        // Với mỗi diploma: tính hash + so sánh on-chain
        const results = [];
        for (const d of rows) {
            let computedRecordHash = null;
            try {
                computedRecordHash = (await computeRecordHashByDiplomaId(d.id)).recordHash;
            } catch (e) { /* file chưa đủ thì bỏ qua */ }

            let onchain = null;
            try { onchain = await chainRead(d.serial_no); } catch (e) { }

            const match = Boolean(
                computedRecordHash && onchain?.recordHash && computedRecordHash === onchain.recordHash
            );

            results.push({
                serialNo: d.serial_no,
                studentId: d.student_id,
                studentName: d.student_name,
                status: d.status,
                computedRecordHash,
                onchainRecordHash: onchain?.recordHash || null,
                onchainStatus: onchain?.status || null,
                match,
            });
        }

        res.json({ ok: true, data: results });
    } catch (e) { next(e); }
});

export default router;
