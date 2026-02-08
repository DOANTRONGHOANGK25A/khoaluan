import express from "express";
import cors from "cors";

import authRouter from "../routes/auth.js";
import usersRouter from "../routes/users.js";
import diplomasRouter from "../routes/diplomas.js";

const app = express();


app.use(cors());               // cơ bản nhất, chạy dev ok
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/diplomas", diplomasRouter);


import chainRouter from "../routes/chain.js";
import publicRouter from "../routes/public.js";

app.use("/api/chain", chainRouter);
app.use("/api/public", publicRouter);

// error handler cơ bản
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
});

export default app;
