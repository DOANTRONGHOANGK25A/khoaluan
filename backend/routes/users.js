import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../src/db.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";

const router = Router();

// GET /api/users (ADMIN)
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
    try {
        const r = await pool.query("SELECT id, username, role, created_at FROM users ORDER BY id DESC");
        res.json({ ok: true, data: r.rows });
    } catch (e) {
        next(e);
    }
});

// POST /api/users (ADMIN)
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
    try {
        const { username, password, role } = req.body || {};
        if (!username || !password || !role) {
            return res.status(400).json({ ok: false, message: "Vui lòng nhập tên đăng nhập, mật khẩu và vai trò" });
        }

        const allowed = ["ADMIN", "STAFF", "MANAGER", "ISSUER"];
        if (!allowed.includes(role)) {
            return res.status(400).json({ ok: false, message: "Vai trò không hợp lệ" });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const r = await pool.query(
            "INSERT INTO users(username, password_hash, role) VALUES($1,$2,$3) RETURNING id, username, role, created_at",
            [username, password_hash, role]
        );

        res.status(201).json({ ok: true, data: r.rows[0] });
    } catch (e) {
        // trùng username => lỗi unique
        if (String(e?.message || "").includes("duplicate")) {
            return res.status(409).json({ ok: false, message: "Tên đăng nhập đã tồn tại" });
        }
        next(e);
    }
});

export default router;
