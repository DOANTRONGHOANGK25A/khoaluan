import crypto from "crypto";
import { pool } from "../src/db.js";

/* ── low-level helpers ── */

export function sha256Hex(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
}

/** Trim, collapse whitespace, remove stray newlines, NFC-normalise */
function normStr(x) {
    if (x === null || x === undefined) return "";
    return x.toString().normalize("NFC").trim().replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");
}

/** Always YYYY-MM-DD */
function normDate(x) {
    if (!x) return "";
    if (x instanceof Date) return x.toISOString().slice(0, 10);
    return x.toString().trim().slice(0, 10);
}

/** Always 4-digit year string */
function normYear(x) {
    if (x === null || x === undefined) return "";
    return String(Number(x));
}

/** Always X.XX (2 decimal places) */
function normGpa(x) {
    if (x === null || x === undefined) return "";
    return Number(x).toFixed(2);
}

/* ── canonical text builder (deterministic, key=value lines) ── */

/**
 * Build a deterministic canonical text from diploma core fields
 * and the three file SHA-256 hashes.
 *
 * Field order is FIXED:
 *   serialNo, studentId, studentName, birthDate, major, ranking,
 *   gpa, graduationYear, portraitSha256, diplomaSha256, transcriptSha256
 *
 * @param {object} fields  – must contain all 11 keys
 * @returns {string} lines joined by LF (\n)
 */
export function buildCanonicalText(fields) {
    const lines = [
        `serialNo=${normStr(fields.serialNo)}`,
        `studentId=${normStr(fields.studentId)}`,
        `studentName=${normStr(fields.studentName)}`,
        `birthDate=${normDate(fields.birthDate)}`,
        `major=${normStr(fields.major)}`,
        `ranking=${normStr(fields.ranking)}`,
        `gpa=${normGpa(fields.gpa)}`,
        `graduationYear=${normYear(fields.graduationYear)}`,
        `portraitSha256=${fields.portraitSha256 || ""}`,
        `diplomaSha256=${fields.diplomaSha256 || ""}`,
        `transcriptSha256=${fields.transcriptSha256 || ""}`,
    ];
    return lines.join("\n");
}

/** sha256( utf-8( canonicalText ) )  →  hex lowercase */
export function computeRecordHash(canonicalText) {
    return sha256Hex(Buffer.from(canonicalText, "utf8"));
}

/* ── main entry: read DB + files → recordHash ── */

export async function computeRecordHashByDiplomaId(id) {
    const d = await pool.query("SELECT * FROM diplomas WHERE id=$1", [id]);
    const row = d.rows[0];
    if (!row) throw new Error("DIPLOMA_NOT_FOUND");

    const f = await pool.query(
        "SELECT kind, data FROM diploma_files WHERE diploma_id=$1",
        [id]
    );

    const map = new Map(f.rows.map(x => [x.kind, x.data]));
    for (const k of ["PORTRAIT", "DIPLOMA", "TRANSCRIPT"]) {
        if (!map.get(k)) throw new Error(`MISSING_FILE_${k}`);
    }

    const portraitSha256 = sha256Hex(map.get("PORTRAIT"));
    const diplomaSha256 = sha256Hex(map.get("DIPLOMA"));
    const transcriptSha256 = sha256Hex(map.get("TRANSCRIPT"));

    const canonicalText = buildCanonicalText({
        serialNo: row.serial_no,
        studentId: row.student_id,
        studentName: row.student_name,
        birthDate: row.birth_date,
        major: row.major,
        ranking: row.ranking,
        gpa: row.gpa,
        graduationYear: row.graduation_year,
        portraitSha256,
        diplomaSha256,
        transcriptSha256,
    });

    const recordHash = computeRecordHash(canonicalText);
    return { recordHash, canonicalText };
}
