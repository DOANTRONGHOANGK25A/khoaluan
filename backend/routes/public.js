import { Router } from "express";
import { pool } from "../src/db.js";
import { chainRead } from "../services/fabricDiploma.js";
import { computeRecordHashByDiplomaId } from "../services/recordHash.js";

const router = Router();

// ─── GET /api/public/search ─── off-chain search (nhanh, không gọi blockchain)
// query: type = serialNo | studentId | studentName , value = ...
router.get("/search", async (req, res, next) => {
    try {
        const type = (req.query.type || "").trim();
        const value = (req.query.value || "").trim();

        if (!type || !value) {
            return res.status(400).json({ ok: false, message: "type and value required" });
        }

        let rows = [];
        if (type === "serialNo") {
            const r = await pool.query(
                `SELECT id, serial_no, student_id, student_name, birth_date, major, ranking, gpa, graduation_year, status
                 FROM diplomas WHERE serial_no = $1`, [value]
            );
            rows = r.rows;
        } else if (type === "studentId") {
            const r = await pool.query(
                `SELECT id, serial_no, student_id, student_name, birth_date, major, ranking, gpa, graduation_year, status
                 FROM diplomas WHERE student_id = $1 LIMIT 20`, [value]
            );
            rows = r.rows;
        } else if (type === "studentName") {
            const r = await pool.query(
                `SELECT id, serial_no, student_id, student_name, birth_date, major, ranking, gpa, graduation_year, status
                 FROM diplomas WHERE student_name ILIKE $1 LIMIT 20`, [`%${value}%`]
            );
            rows = r.rows;
        } else {
            return res.status(400).json({ ok: false, message: "type must be serialNo, studentId, or studentName" });
        }

        // camelCase cho frontend
        const results = rows.map(r => ({
            id: r.id,
            serialNo: r.serial_no,
            studentId: r.student_id,
            studentName: r.student_name,
            birthDate: r.birth_date,
            major: r.major,
            ranking: r.ranking,
            gpa: r.gpa,
            graduationYear: r.graduation_year,
            status: r.status,
        }));

        res.json({ ok: true, query: { type, value }, results });
    } catch (e) { next(e); }
});

// ─── GET /api/public/verify?serialNo=... ─── compute hash + đọc on-chain
router.get("/verify", async (req, res, next) => {
    try {
        const serialNo = (req.query.serialNo || "").trim();
        if (!serialNo) return res.status(400).json({ ok: false, message: "serialNo required" });

        // Tìm diploma
        const r = await pool.query(
            "SELECT id, serial_no, status FROM diplomas WHERE serial_no=$1", [serialNo]
        );
        const d = r.rows[0];
        if (!d) {
            return res.json({
                ok: true,
                serialNo,
                computedRecordHash: null,
                offchainStatus: null,
                onchain: { exists: false },
                match: false,
            });
        }

        // Tính recordHash off-chain
        let computedRecordHash = null;
        try {
            computedRecordHash = (await computeRecordHashByDiplomaId(d.id)).recordHash;
        } catch (e) { /* file chưa đủ */ }

        // Đọc on-chain
        let onchain = { exists: false };
        try {
            const oc = await chainRead(d.serial_no);
            // Trả về full record từ chaincode
            onchain = {
                exists: true,
                serialNo: oc.serialNo || null,
                studentId: oc.studentId || null,
                studentName: oc.studentName || null,
                birthDate: oc.birthDate || null,
                major: oc.major || null,
                ranking: oc.ranking || null,
                gpa: oc.gpa || null,
                graduationYear: oc.graduationYear || null,
                recordHash: oc.recordHash || null,
                status: oc.status || null,
                issuedAt: oc.issuedAt || null,
                revokedAt: oc.revokedAt || null,
                txId: oc.txId || null,
            };
        } catch (e) { /* chưa ghi on-chain */ }

        const match = Boolean(
            computedRecordHash && onchain.exists && onchain.recordHash && computedRecordHash === onchain.recordHash
        );

        res.json({
            ok: true,
            serialNo: d.serial_no,
            computedRecordHash,
            offchainStatus: d.status,
            onchain,
            match,
        });
    } catch (e) { next(e); }
});

export default router;
