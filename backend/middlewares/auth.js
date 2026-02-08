import { getSession } from "../src/sessionStore.js";

export function requireAuth(req, res, next) {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ ok: false, message: "Missing token" });
    }

    const session = getSession(token);
    if (!session) {
        return res.status(401).json({ ok: false, message: "Invalid/expired token" });
    }

    req.user = { id: session.userId, role: session.role, username: session.username };
    req.token = token;
    next();
}
