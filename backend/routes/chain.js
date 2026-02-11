import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";
import { chainRead } from "../services/fabricDiploma.js";

const router = Router();

router.get("/diplomas/:serialNo", requireAuth, requireRole("STAFF", "MANAGER", "ISSUER"), async (req, res, next) => {
    try {
        const out = await chainRead(req.params.serialNo);
        res.json({ ok: true, data: out });
    } catch (e) {
        // chaincode bạn hay trả NOT_FOUND
        if (String(e?.message || "").includes("NOT_FOUND")) {
            return res.status(404).json({ ok: false, message: "Không tìm thấy dữ liệu trên blockchain" });
        }
        next(e);
    }
});

export default router;
