import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../src/db.js";
import { createSession, deleteSession } from "../src/sessionStore.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ ok: false, message: "username/password required" });
        }

        const r = await pool.query("SELECT id, username, password_hash, role FROM users WHERE username=$1", [username]);
        const user = r.rows[0];
        if (!user) return res.status(401).json({ ok: false, message: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });

        const token = createSession({ userId: user.id, role: user.role, username: user.username });

        res.json({
            ok: true,
            data: {
                token,
                user: { id: user.id, username: user.username, role: user.role },
            },
        });
    } catch (e) {
        next(e);
    }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
    res.json({ ok: true, data: { user: req.user } });
});

// POST /api/auth/logout
router.post("/logout", requireAuth, (req, res) => {
    deleteSession(req.token);
    res.json({ ok: true });
});

export default router;
