import fs from "fs";
import path from "path";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";

const router = Router();

// POST /api/issuer/wallet — tạo wallet.json từ admin credentials (test-network)
// Production thật sẽ gọi Fabric CA register+enroll, ở đây demo dùng certs có sẵn
router.post("/wallet", requireAuth, requireRole("ISSUER"), (req, res, next) => {
    try {
        const certPem = fs.readFileSync(process.env.FABRIC_CERT_PATH, "utf8");

        // key nằm trong thư mục, lấy file đầu tiên
        const keyDir = process.env.FABRIC_KEY_DIR;
        const keyFile = fs.readdirSync(keyDir).filter(f => !f.startsWith("."))[0];
        if (!keyFile) throw new Error("No key file in FABRIC_KEY_DIR");
        const privateKeyPem = fs.readFileSync(path.join(keyDir, keyFile), "utf8");

        const wallet = {
            mspId: process.env.FABRIC_MSPID || "Org1MSP",
            certificate: certPem,
            privateKey: privateKeyPem,
        };

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", 'attachment; filename="wallet.json"');
        res.send(JSON.stringify(wallet, null, 2));
    } catch (e) {
        next(e);
    }
});

export default router;
