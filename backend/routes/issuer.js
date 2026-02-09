import fs from "fs";
import { Router } from "express";
import FabricCAServices from "fabric-ca-client";
import { User } from "fabric-common";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";

const router = Router();

/**
 * POST /api/issuer/wallet
 * Tạo wallet.json mới bằng cách register + enroll user mới qua Fabric CA
 * Trả về file download chứa { mspId, certificate, privateKey }
 */
router.post("/wallet", requireAuth, requireRole("ISSUER"), async (req, res, next) => {
    try {
        // 1) Đọc env
        const caUrl = process.env.FABRIC_CA_URL;
        const caName = process.env.FABRIC_CA_NAME || undefined;
        const registrarId = process.env.FABRIC_CA_REGISTRAR_ID;
        const registrarSecret = process.env.FABRIC_CA_REGISTRAR_SECRET;
        const affiliation = process.env.FABRIC_CA_AFFILIATION || "org1.department1";
        const mspId = process.env.FABRIC_MSPID || "Org1MSP";
        const caVerify = process.env.FABRIC_CA_VERIFY !== "false"; // mặc định verify=true
        const caTlsCertPath = process.env.FABRIC_CA_TLS_CERT_PATH;

        // Validate env
        if (!caUrl || !registrarId || !registrarSecret) {
            return res.status(500).json({
                ok: false,
                message: "Thiếu env: FABRIC_CA_URL, FABRIC_CA_REGISTRAR_ID, FABRIC_CA_REGISTRAR_SECRET"
            });
        }

        // 2) TLS options
        let tlsOptions = { verify: false };
        if (caVerify && caTlsCertPath) {
            if (!fs.existsSync(caTlsCertPath)) {
                return res.status(500).json({
                    ok: false,
                    message: `FABRIC_CA_TLS_CERT_PATH không tồn tại: ${caTlsCertPath}`
                });
            }
            const caCert = fs.readFileSync(caTlsCertPath, "utf8");
            tlsOptions = { trustedRoots: [caCert], verify: true };
        }

        // 3) Tạo CA client
        let caClient;
        try {
            caClient = new FabricCAServices(caUrl, { trustedRoots: tlsOptions.trustedRoots || [], verify: tlsOptions.verify }, caName);
        } catch (e) {
            return res.status(503).json({
                ok: false,
                message: `Không thể khởi tạo CA client: ${e.message}`
            });
        }

        // 4) Enroll registrar (admin)
        let adminEnrollment;
        try {
            adminEnrollment = await caClient.enroll({
                enrollmentID: registrarId,
                enrollmentSecret: registrarSecret
            });
        } catch (e) {
            return res.status(503).json({
                ok: false,
                message: `Không thể enroll registrar. CA có đang chạy không? Lỗi: ${e.message}`
            });
        }

        // 5) Tạo admin user object để register user mới
        const adminUser = new User(registrarId);
        await adminUser.setEnrollment(
            adminEnrollment.key,
            adminEnrollment.certificate,
            mspId
        );

        // 6) Register user mới
        const enrollmentID = `issuer_${Date.now()}`;
        let enrollmentSecret;
        try {
            enrollmentSecret = await caClient.register(
                {
                    enrollmentID: enrollmentID,
                    affiliation: affiliation,
                    role: "client"
                },
                adminUser
            );
        } catch (e) {
            return res.status(500).json({
                ok: false,
                message: `Không thể register user mới: ${e.message}`
            });
        }

        // 7) Enroll user mới
        let issuerEnrollment;
        try {
            issuerEnrollment = await caClient.enroll({
                enrollmentID: enrollmentID,
                enrollmentSecret: enrollmentSecret
            });
        } catch (e) {
            return res.status(500).json({
                ok: false,
                message: `Không thể enroll user mới: ${e.message}`
            });
        }

        // 8) Lấy certificate và private key
        const certificate = issuerEnrollment.certificate;
        const privateKey = issuerEnrollment.key.toBytes();

        // 9) Build wallet object
        const wallet = {
            mspId: mspId,
            certificate: certificate,
            privateKey: privateKey
        };

        // 10) Response download
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", 'attachment; filename="wallet.json"');
        res.send(JSON.stringify(wallet, null, 2));

    } catch (e) {
        console.error("Error creating wallet:", e);
        next(e);
    }
});

export default router;
