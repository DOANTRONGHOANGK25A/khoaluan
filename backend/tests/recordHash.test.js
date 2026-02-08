/**
 * Unit test for deterministic recordHash (hash-of-hashes).
 *
 * Run:  node backend/tests/recordHash.test.js
 *       (no DB required — pure function test)
 */
import crypto from "crypto";
import { buildCanonicalText, computeRecordHash, sha256Hex } from "../services/recordHash.js";

/* ── test data ── */

const portraitBytes  = Buffer.from("fake-portrait-binary-content");
const diplomaBytes   = Buffer.from("fake-diploma-binary-content");
const transcriptBytes = Buffer.from("fake-transcript-binary-content");

const portraitSha256   = sha256Hex(portraitBytes);
const diplomaSha256    = sha256Hex(diplomaBytes);
const transcriptSha256 = sha256Hex(transcriptBytes);

const sampleFields = {
    serialNo: "VB001",
    studentId: "SV001",
    studentName: "Nguyễn Văn A",
    birthDate: "2000-01-15",
    major: "Công nghệ thông tin",
    ranking: "Giỏi",
    gpa: "3.8",           // should become 3.80
    graduationYear: 2024,  // number → "2024"
    portraitSha256,
    diplomaSha256,
    transcriptSha256,
};

/* ── helpers ── */

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) {
        passed++;
        console.log(`  ✓ ${msg}`);
    } else {
        failed++;
        console.error(`  ✗ ${msg}`);
    }
}

/* ── tests ── */

console.log("\n=== recordHash deterministic tests ===\n");

// 1. buildCanonicalText produces correct format
console.log("1) canonicalText format");
const ct = buildCanonicalText(sampleFields);
const lines = ct.split("\n");

assert(lines.length === 11, "exactly 11 lines");
assert(lines[0] === "serialNo=VB001", "line 1: serialNo");
assert(lines[1] === "studentId=SV001", "line 2: studentId");
assert(lines[2] === "studentName=Nguyễn Văn A", "line 3: studentName");
assert(lines[3] === "birthDate=2000-01-15", "line 4: birthDate");
assert(lines[4] === "major=Công nghệ thông tin", "line 5: major");
assert(lines[5] === "ranking=Giỏi", "line 6: ranking");
assert(lines[6] === "gpa=3.80", "line 7: gpa normalised to 2 decimal places");
assert(lines[7] === "graduationYear=2024", "line 8: graduationYear as string");
assert(lines[8] === `portraitSha256=${portraitSha256}`, "line 9: portraitSha256");
assert(lines[9] === `diplomaSha256=${diplomaSha256}`, "line 10: diplomaSha256");
assert(lines[10] === `transcriptSha256=${transcriptSha256}`, "line 11: transcriptSha256");

// 2. Stability: same input → same hash every time
console.log("\n2) Deterministic hash stability");
const hash1 = computeRecordHash(buildCanonicalText(sampleFields));
const hash2 = computeRecordHash(buildCanonicalText(sampleFields));
const hash3 = computeRecordHash(buildCanonicalText(sampleFields));

assert(hash1 === hash2, "hash1 === hash2");
assert(hash2 === hash3, "hash2 === hash3");
assert(/^[0-9a-f]{64}$/.test(hash1), "hash is 64-char lowercase hex");
console.log(`   recordHash = ${hash1}`);

// 3. Normalisation: whitespace trimming, gpa, date, year
console.log("\n3) Normalisation edge cases");

const messy = {
    ...sampleFields,
    serialNo: "  VB001  ",           // extra spaces
    studentName: " Nguyễn  Văn   A ", // internal multi-space
    gpa: 3.8,                         // number, not string
    graduationYear: "2024",            // string, not number
    birthDate: new Date("2000-01-15T00:00:00Z"), // Date object
};

const ctMessy = buildCanonicalText(messy);
const hashMessy = computeRecordHash(ctMessy);

assert(hashMessy === hash1, "normalised messy input → same hash as clean input");

// 4. Newline in studentName should be collapsed
console.log("\n4) Newline in string fields");
const withNewline = { ...sampleFields, studentName: "Nguyễn\nVăn\r\nA" };
const ctNl = buildCanonicalText(withNewline);
assert(ctNl.includes("studentName=Nguyễn Văn A"), "newlines in name collapsed to spaces");

// 5. Null/undefined fields
console.log("\n5) Null/undefined fields produce empty values");
const withNulls = {
    serialNo: "VB002",
    studentId: "SV002",
    studentName: "Test",
    birthDate: null,
    major: undefined,
    ranking: null,
    gpa: null,
    graduationYear: null,
    portraitSha256: portraitSha256,
    diplomaSha256: diplomaSha256,
    transcriptSha256: transcriptSha256,
};
const ctNull = buildCanonicalText(withNulls);
const nullLines = ctNull.split("\n");
assert(nullLines[3] === "birthDate=", "null birthDate → empty");
assert(nullLines[4] === "major=", "undefined major → empty");
assert(nullLines[6] === "gpa=", "null gpa → empty");
assert(nullLines[7] === "graduationYear=", "null graduationYear → empty");

// 6. Different data → different hash
console.log("\n6) Different data → different hash");
const diff = { ...sampleFields, serialNo: "VB999" };
const hashDiff = computeRecordHash(buildCanonicalText(diff));
assert(hashDiff !== hash1, "changing serialNo changes hash");

// 7. File hash changes → recordHash changes
console.log("\n7) Changed file → different hash");
const diffFile = { ...sampleFields, portraitSha256: sha256Hex(Buffer.from("different-portrait")) };
const hashDiffFile = computeRecordHash(buildCanonicalText(diffFile));
assert(hashDiffFile !== hash1, "different portrait file → different hash");

// ── summary ──
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
