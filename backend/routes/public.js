import { Router } from "express";
import { pool } from "../src/db.js";
import { chainRead } from "../services/fabricDiploma.js";
import { computeRecordHashByDiplomaId } from "../services/recordHash.js";

const router = Router();

// GET /api/public/verify?serialNo=VB001
router.get("/verify", async (req, res, next) => {
    try {
        const serialNo = (req.query.serialNo || "").toString().trim();
        if (!serialNo) return res.status(400).json({ ok: false, message: "serialNo required" });

        const r = await pool.query("SELECT id, serial_no, status FROM diplomas WHERE serial_no=$1", [serialNo]);
        const d = r.rows[0];

        let computedRecordHash = null;
        if (d) computedRecordHash = (await computeRecordHashByDiplomaId(d.id)).recordHash;

        let onchain = null;
        try { onchain = await chainRead(serialNo); } catch (e) { }

        const match =
            Boolean(computedRecordHash && onchain?.recordHash && computedRecordHash === onchain.recordHash);

        res.json({
            ok: true,
            data: {
                serialNo,
                offchain: d ? { exists: true, status: d.status, computedRecordHash } : { exists: false },
                onchain: onchain ? { exists: true, status: onchain.status, recordHash: onchain.recordHash } : { exists: false },
                match,
            },
        });
    } catch (e) { next(e); }
});

export default router;
