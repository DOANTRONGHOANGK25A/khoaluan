import fs from "fs";
import path from "path";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";
import { getContract } from "../services/fabricClient.js";

const router = Router();

// POST /api/issuer/wallet — tạo wallet.json từ admin credentials (test-network)
// Kiểm tra network có chạy không trước khi cho tạo wallet
router.post("/wallet", requireAuth, requireRole("ISSUER"), async (req, res, next) => {
    try {
        // 1) Kiểm tra file cert/key có tồn tại không (network đã khởi tạo chưa)
        const certPath = process.env.FABRIC_CERT_PATH;
        const keyDir = process.env.FABRIC_KEY_DIR;

        if (!certPath || !keyDir) {
            return res.status(500).json({ ok: false, message: "FABRIC_CERT_PATH / FABRIC_KEY_DIR chưa cấu hình trong .env" });
        }
        if (!fs.existsSync(certPath)) {
            return res.status(503).json({ ok: false, message: "Certificate không tồn tại. Hãy khởi tạo test-network trước (./network.sh up createChannel -ca)" });
        }
        if (!fs.existsSync(keyDir)) {
            return res.status(503).json({ ok: false, message: "Key directory không tồn tại. Hãy khởi tạo test-network trước" });
        }

        // 2) Thử kết nối Fabric peer để chắc chắn network đang chạy
        try {
            const contract = getContract();
            // evaluateTransaction nhẹ — chỉ query, không ghi ledger
            // Nếu peer chết sẽ throw error
            await contract.evaluateTransaction("ReadDiploma", "__ping__");
        } catch (e) {
            // NOT_FOUND là OK — nghĩa là peer trả lời được, network đang chạy
            if (!String(e?.message || "").includes("NOT_FOUND")) {
                return res.status(503).json({
                    ok: false,
                    message: "Không thể kết nối Fabric network. Hãy chắc chắn test-network đang chạy và chaincode đã deploy",
                });
            }
        }

        // 3) Đọc cert + key
        const certPem = fs.readFileSync(certPath, "utf8");
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
