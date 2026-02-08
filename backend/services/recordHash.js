import crypto from "crypto";
import { pool } from "../src/db.js";

function sha256Hex(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
}
function normStr(x) {
    if (x === null || x === undefined) return null;
    return x.toString().normalize("NFC").trim().replace(/\s+/g, " ");
}
function normDate(x) {
    if (!x) return null;
    if (x instanceof Date) return x.toISOString().slice(0, 10);
    return x.toString().slice(0, 10);
}

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

    const portraitHash = sha256Hex(map.get("PORTRAIT"));
    const diplomaHash = sha256Hex(map.get("DIPLOMA"));
    const transcriptHash = sha256Hex(map.get("TRANSCRIPT"));

    // object theo thứ tự key cố định
    const core = {
        serialNo: normStr(row.serial_no),
        studentId: normStr(row.student_id),
        studentName: normStr(row.student_name),
        birthDate: normDate(row.birth_date),
        major: normStr(row.major),
        ranking: normStr(row.ranking),
        gpa: normStr(row.gpa),
        graduationYear: row.graduation_year ?? null,
        portraitHash,
        diplomaHash,
        transcriptHash,
    };

    const canonicalJson = JSON.stringify(core);
    const recordHash = sha256Hex(Buffer.from(canonicalJson, "utf8"));

    return { recordHash, canonicalJson };
}
