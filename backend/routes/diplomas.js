import { Router } from "express";
import multer from "multer";
import { pool } from "../src/db.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";
import { chainIssue, chainRevoke, chainRead, chainIssueWithWallet, chainRevokeWithWallet } from "../services/fabricDiploma.js";
import { computeRecordHashByDiplomaId } from "../services/recordHash.js";

const router = Router();

// Upload ảnh/PDF (tạo hồ sơ)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = ["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype);
        cb(ok ? null : new Error("Loại tệp không được hỗ trợ"), ok);
    },
});

// Upload wallet.json (issue/revoke)
const walletUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1 * 1024 * 1024 },
});

// Helper: chuẩn hóa cực cơ bản (tuần 4 bạn mới làm canonicalization/hashing đầy đủ)
function trim1(s) {
    return (s ?? "").toString().trim();
}

// ---------------------------
// POST /api/diplomas (STAFF)
// multipart: fields + 3 files: portrait, diploma, transcript
// ---------------------------
router.post(
    "/",
    requireAuth,
    requireRole("STAFF"),
    upload.fields([
        { name: "portrait", maxCount: 1 },
        { name: "diploma", maxCount: 1 },
        { name: "transcript", maxCount: 1 },
    ]),
    async (req, res, next) => {
        const client = await pool.connect();
        try {
            const {
                serialNo,
                studentId,
                studentName,
                birthDate,
                major,
                ranking,
                gpa,
                graduationYear,
            } = req.body || {};

            // validate cơ bản
            if (!serialNo || !studentId || !studentName) {
                return res.status(400).json({ ok: false, message: "Vui lòng nhập số hiệu, mã sinh viên và tên sinh viên" });
            }

            // Validate fields required for future issuance
            if (!birthDate) return res.status(400).json({ ok: false, message: "Thiếu trường bắt buộc: ngày sinh" });
            if (!major) return res.status(400).json({ ok: false, message: "Thiếu trường bắt buộc: ngành học" });
            if (!ranking) return res.status(400).json({ ok: false, message: "Thiếu trường bắt buộc: xếp loại" });
            if (!gpa) return res.status(400).json({ ok: false, message: "Thiếu trường bắt buộc: điểm GPA" });
            if (!graduationYear) return res.status(400).json({ ok: false, message: "Thiếu trường bắt buộc: năm tốt nghiệp" });

            const files = req.files || {};
            const portrait = files.portrait?.[0];
            const diploma = files.diploma?.[0];
            const transcript = files.transcript?.[0];

            if (!portrait || !diploma || !transcript) {
                return res.status(400).json({ ok: false, message: "Cần tải lên 3 tệp: ảnh chân dung, bằng và bảng điểm" });
            }

            await client.query("BEGIN");

            // 1) Insert diplomas (PENDING)
            const r1 = await client.query(
                `INSERT INTO diplomas(
          serial_no, student_id, student_name, birth_date, major, ranking, gpa, graduation_year,
          status, created_by
        )
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,'PENDING',$9)
        RETURNING id, serial_no, student_id, student_name, status, created_at`,
                [
                    trim1(serialNo),
                    trim1(studentId),
                    trim1(studentName),
                    birthDate ? trim1(birthDate) : null,
                    major ? trim1(major) : null,
                    ranking ? trim1(ranking) : null,
                    gpa ? trim1(gpa) : null,
                    graduationYear ? Number(graduationYear) : null,
                    req.user.id,
                ]
            );

            const diplomaRow = r1.rows[0];

            // 2) Insert 3 files (BYTEA) - dùng upsert theo UNIQUE(diploma_id, kind)
            const insertFile = async (kind, f) => {
                await client.query(
                    `INSERT INTO diploma_files(diploma_id, kind, filename, mime_type, size_bytes, data)
           VALUES($1,$2,$3,$4,$5,$6)
           ON CONFLICT (diploma_id, kind)
           DO UPDATE SET filename=EXCLUDED.filename, mime_type=EXCLUDED.mime_type,
                         size_bytes=EXCLUDED.size_bytes, data=EXCLUDED.data, uploaded_at=now()`,
                    [diplomaRow.id, kind, f.originalname, f.mimetype, f.size, f.buffer]
                );
            };

            await insertFile("PORTRAIT", portrait);
            await insertFile("DIPLOMA", diploma);
            await insertFile("TRANSCRIPT", transcript);

            await client.query("COMMIT");

            res.status(201).json({
                ok: true,
                data: {
                    diploma: diplomaRow,
                    fileKinds: ["PORTRAIT", "DIPLOMA", "TRANSCRIPT"],
                },
            });
        } catch (e) {
            await client.query("ROLLBACK");

            // serial_no UNIQUE => conflict
            if (String(e?.message || "").includes("duplicate") || String(e?.code || "") === "23505") {
                return res.status(409).json({ ok: false, message: "Số hiệu văn bằng đã tồn tại" });
            }
            next(e);
        } finally {
            client.release();
        }
    }
);

// ---------------------------
// PUT /api/diplomas/:id (STAFF) - chỉ sửa khi PENDING
// ---------------------------
router.put(
    "/:id",
    requireAuth,
    requireRole("STAFF"),
    upload.fields([
        { name: "portrait", maxCount: 1 },
        { name: "diploma", maxCount: 1 },
        { name: "transcript", maxCount: 1 },
    ]),
    async (req, res, next) => {
        const client = await pool.connect();
        try {
            const id = Number(req.params.id);
            const {
                studentId,
                studentName,
                birthDate,
                major,
                ranking,
                gpa,
                graduationYear,
            } = req.body || {};

            await client.query("BEGIN");

            const r0 = await client.query("SELECT id, serial_no, status FROM diplomas WHERE id=$1 FOR UPDATE", [id]);
            const d0 = r0.rows[0];
            if (!d0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ ok: false, message: "Không tìm thấy" });
            }

            // 1) Allow PENDING or REJECTED
            if (!["PENDING", "REJECTED"].includes(d0.status)) {
                await client.query("ROLLBACK");
                return res.status(400).json({ ok: false, message: "Chỉ có thể cập nhật hồ sơ ở trạng thái Chờ duyệt hoặc Bị từ chối" });
            }

            // 2) Validate required fields
            // Note: studentId/Name are critical. Others are required for issuance later.
            // But we already added validation in previous step.
            // Let's keep it consistent.
            if (!studentId || !studentName || !birthDate || !major || !ranking || !gpa || !graduationYear) {
                await client.query("ROLLBACK");
                return res.status(400).json({ ok: false, message: "Thiếu trường bắt buộc: mã SV, tên SV, ngày sinh, ngành, xếp loại, GPA, năm tốt nghiệp" });
            }

            // 3) Update text fields
            const r = await client.query(
                `UPDATE diplomas
           SET student_id=$1, student_name=$2, birth_date=$3, major=$4, ranking=$5, gpa=$6, graduation_year=$7,
               status='PENDING', updated_at=now()
           WHERE id=$8
           RETURNING id, serial_no, student_id, student_name, status, updated_at`,
                [
                    studentId ? trim1(studentId) : null,
                    studentName ? trim1(studentName) : null,
                    birthDate ? trim1(birthDate) : null,
                    major ? trim1(major) : null,
                    ranking ? trim1(ranking) : null,
                    gpa ? trim1(gpa) : null,
                    graduationYear ? Number(graduationYear) : null,
                    id,
                ]
            );

            // 4) Handle file updates
            const files = req.files || {};
            const portrait = files.portrait?.[0];
            const diplomaPdf = files.diploma?.[0]; // Frontend sends 'diploma'
            const transcriptPdf = files.transcript?.[0]; // Frontend sends 'transcript'

            // Upsert helper with SHA256
            // Based on user request: "tính sha256 của file ... lưu vào bảng diploma_files"
            const upsertFile = async (kind, f) => {
                if (!f) return;
                const importCrypto = await import("crypto"); // Dynamic import or use global require if available. ESM module.
                // Since this file uses `import`, we can import at top level. But function scope is safer if I can't touch top.
                // Wait, I can't touch top level imports easily without replacing whole file.
                // Assuming `crypto` is available or I can import it.
                // Let's use `crypto` from 'node:crypto'.
                const hash = importCrypto.createHash("sha256").update(f.buffer).digest("hex");

                await client.query(
                    `INSERT INTO diploma_files(diploma_id, kind, filename, mime_type, size_bytes, data, sha256)
               VALUES($1,$2,$3,$4,$5,$6,$7)
               ON CONFLICT (diploma_id, kind)
               DO UPDATE SET filename=EXCLUDED.filename, mime_type=EXCLUDED.mime_type,
                             size_bytes=EXCLUDED.size_bytes, data=EXCLUDED.data, sha256=EXCLUDED.sha256, uploaded_at=now()`,
                    [id, kind, f.originalname, f.mimetype, f.size, f.buffer, hash]
                );
            };

            // Mapping: 'PORTRAIT', 'DIPLOMA', 'TRANSCRIPT'
            await upsertFile("PORTRAIT", portrait);
            await upsertFile("DIPLOMA", diplomaPdf);
            await upsertFile("TRANSCRIPT", transcriptPdf);

            await client.query("COMMIT");
            res.json({ ok: true, data: r.rows[0] });
        } catch (e) {
            await client.query("ROLLBACK");
            next(e);
        } finally {
            client.release();
        }
    }
);

// ---------------------------
// GET /api/diplomas (STAFF/MANAGER/ISSUER) - list + search cơ bản
// query: q, status
// ---------------------------
router.get("/", requireAuth, requireRole("ADMIN", "STAFF", "MANAGER", "ISSUER"), async (req, res, next) => {
    try {
        const q = (req.query.q || "").toString().trim();
        const status = (req.query.status || "").toString().trim();

        const params = [];
        const where = [];

        if (status) {
            params.push(status);
            where.push(`d.status = $${params.length}`);
        }

        if (q) {
            params.push(`%${q.toLowerCase()}%`);
            where.push(`(
        lower(d.serial_no) LIKE $${params.length}
        OR lower(d.student_id) LIKE $${params.length}
        OR lower(d.student_name) LIKE $${params.length}
      )`);
        }

        const sql = `
      SELECT d.*,
        (SELECT COUNT(*) FROM diploma_files f WHERE f.diploma_id=d.id) AS file_count,
        (SELECT c.tx_id FROM chain_logs c WHERE c.diploma_id=d.id ORDER BY c.created_at DESC LIMIT 1) AS last_tx_id
      FROM diplomas d
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY d.created_at DESC
      LIMIT 50
    `;

        const r = await pool.query(sql, params);
        res.json({ ok: true, data: r.rows });
    } catch (e) {
        next(e);
    }
});

// ---------------------------
// GET /api/diplomas/:id (STAFF/MANAGER/ISSUER) - chi tiết
// ---------------------------
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF", "MANAGER", "ISSUER"), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const r = await pool.query(
            `SELECT d.*,
        (SELECT COUNT(*) FROM diploma_files f WHERE f.diploma_id=d.id) AS file_count,
        (SELECT c.tx_id FROM chain_logs c WHERE c.diploma_id=d.id ORDER BY c.created_at DESC LIMIT 1) AS last_tx_id
       FROM diplomas d WHERE d.id=$1`,
            [id]
        );
        const row = r.rows[0];
        if (!row) return res.status(404).json({ ok: false, message: "Không tìm thấy" });
        res.json({ ok: true, data: row });
    } catch (e) {
        next(e);
    }
});

// ---------------------------
// GET /api/diplomas/:id/files/:kind (STAFF/MANAGER/ISSUER)
// kind: PORTRAIT | DIPLOMA | TRANSCRIPT
// ---------------------------
router.get(
    "/:id/files/:kind",
    requireAuth,
    requireRole("ADMIN", "STAFF", "MANAGER", "ISSUER"),
    async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            const kind = req.params.kind?.toUpperCase();

            const allowed = ["PORTRAIT", "DIPLOMA", "TRANSCRIPT"];
            if (!allowed.includes(kind)) {
                return res.status(400).json({ ok: false, message: "Loại tệp không hợp lệ" });
            }

            const r = await pool.query(
                `SELECT filename, mime_type, data FROM diploma_files
         WHERE diploma_id=$1 AND kind=$2`,
                [id, kind]
            );
            const f = r.rows[0];
            if (!f) return res.status(404).json({ ok: false, message: "Không tìm thấy tệp" });

            res.setHeader("Content-Type", f.mime_type || "application/octet-stream");
            // cơ bản: cho tải xuống
            res.setHeader("Content-Disposition", `attachment; filename="${f.filename || kind}"`);
            res.send(f.data);
        } catch (e) {
            next(e);
        }
    }
);

router.post("/:id/approve", requireAuth, requireRole("MANAGER"), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const id = Number(req.params.id);
        const note = (req.body?.note || "").toString().trim();

        await client.query("BEGIN");

        const r0 = await client.query("SELECT status FROM diplomas WHERE id=$1 FOR UPDATE", [id]);
        const d0 = r0.rows[0];
        if (!d0) { await client.query("ROLLBACK"); return res.status(404).json({ ok: false, message: "Không tìm thấy" }); }
        if (d0.status !== "PENDING") { await client.query("ROLLBACK"); return res.status(400).json({ ok: false, message: "Chỉ có thể duyệt hồ sơ ở trạng thái Chờ duyệt" }); }

        const r1 = await client.query(
            `UPDATE diplomas
       SET status='APPROVED', approved_by=$1, approved_at=now(), updated_at=now()
       WHERE id=$2
       RETURNING id, serial_no, status, approved_by, approved_at`,
            [req.user.id, id]
        );

        await client.query(
            `INSERT INTO approval_logs(diploma_id, actor_id, action, note)
       VALUES($1,$2,'APPROVE',$3)`,
            [id, req.user.id, note || null]
        );

        await client.query("COMMIT");
        res.json({ ok: true, data: r1.rows[0] });
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
});

router.post("/:id/reject", requireAuth, requireRole("MANAGER"), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const note = (req.body?.note || "").toString().trim();

        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const r0 = await client.query("SELECT status FROM diplomas WHERE id=$1 FOR UPDATE", [id]);
            const d0 = r0.rows[0];
            if (!d0) { await client.query("ROLLBACK"); return res.status(404).json({ ok: false, message: "Không tìm thấy" }); }
            if (d0.status !== "PENDING") { await client.query("ROLLBACK"); return res.status(400).json({ ok: false, message: "Chỉ có thể từ chối hồ sơ ở trạng thái Chờ duyệt" }); }

            const r1 = await client.query(
                `UPDATE diplomas
           SET status='REJECTED', rejected_reason=$1, rejected_role='MANAGER', rejected_at=now(), updated_at=now()
           WHERE id=$2
           RETURNING id, serial_no, status, updated_at`,
                [note || null, id]
            );

            await client.query(
                `INSERT INTO approval_logs(diploma_id, actor_id, action, note)
           VALUES($1,$2,'REJECT',$3)`,
                [id, req.user.id, note || null]
            );

            await client.query("COMMIT");
            res.json({ ok: true, data: r1.rows[0] });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    } catch (e) { next(e); }
});


router.get("/:id/approval-logs", requireAuth, requireRole("STAFF", "MANAGER", "ISSUER"), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const r = await pool.query(
            "SELECT id, actor_id, action, note, created_at FROM approval_logs WHERE diploma_id=$1 ORDER BY created_at ASC",
            [id]
        );
        res.json({ ok: true, data: r.rows });
    } catch (e) { next(e); }
});

router.get("/:id/chain-logs", requireAuth, requireRole("STAFF", "MANAGER", "ISSUER"), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const r = await pool.query(
            "SELECT action, tx_id, record_hash, onchain_status, created_at FROM chain_logs WHERE diploma_id=$1 ORDER BY created_at ASC",
            [id]
        );
        res.json({ ok: true, data: r.rows });
    } catch (e) { next(e); }
});




router.get("/:id/recordhash", requireAuth, requireRole("STAFF", "MANAGER", "ISSUER"), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const out = await computeRecordHashByDiplomaId(id);
        res.json({ ok: true, data: out });
    } catch (e) { next(e); }
});


router.post("/:id/issue", requireAuth, requireRole("ISSUER"), walletUpload.single("walletFile"), async (req, res, next) => {
    // Bắt buộc upload wallet
    if (!req.file) return res.status(400).json({ ok: false, message: "Vui lòng tải lên tệp ví (wallet)" });

    let wallet;
    try { wallet = JSON.parse(req.file.buffer.toString("utf8")); }
    catch { return res.status(400).json({ ok: false, message: "Tệp ví không đúng định dạng JSON" }); }

    const { mspId, certificate, privateKey } = wallet;
    if (!mspId || !certificate || !privateKey) {
        return res.status(400).json({ ok: false, message: "Tệp ví phải chứa mspId, certificate và privateKey" });
    }

    const client = await pool.connect();
    try {
        const id = Number(req.params.id);
        await client.query("BEGIN");

        // Lấy đầy đủ thông tin diploma
        const r0 = await client.query(
            `SELECT id, serial_no, student_id, student_name, birth_date, major, ranking, gpa, graduation_year, status 
             FROM diplomas WHERE id=$1 FOR UPDATE`,
            [id]
        );
        const d = r0.rows[0];
        if (!d) { await client.query("ROLLBACK"); return res.status(404).json({ ok: false, message: "Không tìm thấy" }); }
        if (d.status !== "APPROVED") { await client.query("ROLLBACK"); return res.status(400).json({ ok: false, message: "Chỉ có thể phát hành văn bằng đã được duyệt" }); }

        // Validate required fields for chaincode
        const missing = [];
        if (!d.student_id) missing.push("studentId");
        if (!d.student_name) missing.push("studentName");
        if (!d.birth_date) missing.push("birthDate");
        if (!d.major) missing.push("major");
        if (!d.ranking) missing.push("ranking");
        if (!d.gpa) missing.push("gpa");
        if (!d.graduation_year) missing.push("graduationYear");

        if (missing.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ ok: false, message: `Không thể phát hành. Thiếu trường: ${missing.join(", ")}` });
        }

        // Tính recordHash
        const { recordHash } = await computeRecordHashByDiplomaId(id);

        // Tạo object chứa đủ thông tin để ghi on-chain
        const issuedAt = new Date().toISOString();
        const diplomaData = {
            studentId: d.student_id,
            studentName: d.student_name,
            birthDate: d.birth_date ? d.birth_date.toISOString().slice(0, 10) : "",
            major: d.major || "",
            ranking: d.ranking || "",
            gpa: d.gpa || "",
            graduationYear: d.graduation_year || "",
            recordHash,
            status: "ISSUED",
            issuedAt,
            revokedAt: null
        };

        // Gọi chaincode với jsonRecordString
        const onchain = await chainIssueWithWallet(d.serial_no, diplomaData, mspId, certificate, privateKey);

        const r1 = await client.query(
            `UPDATE diplomas
       SET status='ISSUED', issued_by=$1, issued_at=now()
       WHERE id=$2
       RETURNING id, serial_no, status, issued_at`,
            [req.user.id, id]
        );

        await client.query(
            `INSERT INTO chain_logs(diploma_id, actor_id, action, tx_id, record_hash, onchain_status)
       VALUES($1,$2,'ISSUE',$3,$4,'ISSUED')`,
            [id, req.user.id, onchain.txId || null, recordHash]
        );

        await client.query("COMMIT");
        res.json({ ok: true, data: { diploma: r1.rows[0], onchain } });
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
});


router.post("/:id/revoke", requireAuth, requireRole("ISSUER"), walletUpload.single("walletFile"), async (req, res, next) => {
    // Bắt buộc upload wallet
    if (!req.file) return res.status(400).json({ ok: false, message: "Vui lòng tải lên tệp ví (wallet)" });

    let wallet;
    try { wallet = JSON.parse(req.file.buffer.toString("utf8")); }
    catch { return res.status(400).json({ ok: false, message: "Tệp ví không đúng định dạng JSON" }); }

    const { mspId, certificate, privateKey } = wallet;
    if (!mspId || !certificate || !privateKey) {
        return res.status(400).json({ ok: false, message: "Tệp ví phải chứa mspId, certificate và privateKey" });
    }

    const client = await pool.connect();
    try {
        const id = Number(req.params.id);
        await client.query("BEGIN");

        const r0 = await client.query(
            "SELECT id, serial_no, status FROM diplomas WHERE id=$1 FOR UPDATE",
            [id]
        );
        const d = r0.rows[0];
        if (!d) { await client.query("ROLLBACK"); return res.status(404).json({ ok: false, message: "Không tìm thấy" }); }
        if (d.status !== "ISSUED") { await client.query("ROLLBACK"); return res.status(400).json({ ok: false, message: "Chỉ có thể thu hồi văn bằng đã phát hành" }); }

        // đọc on-chain để lấy recordHash log cho chắc
        const before = await chainRead(d.serial_no);

        const revokedAt = new Date().toISOString();
        const onchain = await chainRevokeWithWallet(d.serial_no, revokedAt, mspId, certificate, privateKey);

        const r1 = await client.query(
            `UPDATE diplomas
       SET status='REVOKED', revoked_by=$1, revoked_at=now()
       WHERE id=$2
       RETURNING id, serial_no, status, revoked_at`,
            [req.user.id, id]
        );

        await client.query(
            `INSERT INTO chain_logs(diploma_id, actor_id, action, tx_id, record_hash, onchain_status)
       VALUES($1,$2,'REVOKE',$3,$4,'REVOKED')`,
            [id, req.user.id, onchain.txId || null, before.recordHash || null]
        );

        await client.query("COMMIT");
        res.json({ ok: true, data: { diploma: r1.rows[0], onchain } });
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
});

// ---------------------------
// POST /api/diplomas/:id/reject-issue (ISSUER/PRINCIPAL)
// Từ chối phát hành: APPROVED -> REJECTED
// ---------------------------
router.post("/:id/reject-issue", requireAuth, requireRole("ISSUER"), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const id = Number(req.params.id);
        const reason = (req.body?.reason || "").toString().trim();

        await client.query("BEGIN");
        const r0 = await client.query("SELECT status FROM diplomas WHERE id=$1 FOR UPDATE", [id]);
        const d0 = r0.rows[0];
        if (!d0) { await client.query("ROLLBACK"); return res.status(404).json({ ok: false, message: "Không tìm thấy" }); }
        if (d0.status !== "APPROVED") { await client.query("ROLLBACK"); return res.status(400).json({ ok: false, message: "Chỉ có thể từ chối phát hành văn bằng đã được duyệt" }); }

        const r1 = await client.query(
            `UPDATE diplomas
       SET status='REJECTED', rejected_reason=$1, rejected_role='PRINCIPAL', rejected_at=now(), updated_at=now()
       WHERE id=$2
       RETURNING id, serial_no, status, rejected_reason, rejected_role, rejected_at`,
            [reason || null, id]
        );

        await client.query(
            `INSERT INTO approval_logs(diploma_id, actor_id, action, note)
       VALUES($1,$2,'REJECT',$3)`,
            [id, req.user.id, reason || null]
        );

        await client.query("COMMIT");
        res.json({ ok: true, data: r1.rows[0] });
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
});

// ---------------------------
// POST /api/diplomas/:id/resubmit (STAFF)
// Gửi lại: REJECTED -> PENDING
// ---------------------------
router.post("/:id/resubmit", requireAuth, requireRole("STAFF"), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const id = Number(req.params.id);

        await client.query("BEGIN");
        const r0 = await client.query("SELECT status FROM diplomas WHERE id=$1 FOR UPDATE", [id]);
        const d0 = r0.rows[0];
        if (!d0) { await client.query("ROLLBACK"); return res.status(404).json({ ok: false, message: "Không tìm thấy" }); }
        if (d0.status !== "REJECTED") { await client.query("ROLLBACK"); return res.status(400).json({ ok: false, message: "Chỉ có thể gửi lại hồ sơ bị từ chối" }); }

        const r1 = await client.query(
            `UPDATE diplomas
       SET status='PENDING', rejected_reason=NULL, rejected_role=NULL, rejected_at=NULL, updated_at=now()
       WHERE id=$1
       RETURNING id, serial_no, status, updated_at`,
            [id]
        );

        await client.query("COMMIT");
        res.json({ ok: true, data: r1.rows[0] });
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
});

export default router;
