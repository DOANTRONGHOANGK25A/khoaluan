# RecordHash Spec v1.0 (MVP)

## 1) Mục tiêu
`recordHash` là mã băm duy nhất đại diện cho **nội dung văn bằng** tại thời điểm phát hành.  
Nếu thay đổi bất kỳ dữ liệu lõi hoặc file đính kèm nào thì `recordHash` phải thay đổi.

---

## 2) Phạm vi dữ liệu đưa vào hash

### 2.1 Core fields (bắt buộc, đúng thứ tự)
1. `serialNo`
2. `studentId`
3. `studentName`
4. `birthDate`
5. `major`
6. `ranking`
7. `gpa`
8. `graduationYear`

### 2.2 File bytes (bắt buộc, đúng thứ tự)
1. `portrait` (ảnh chân dung)
2. `diploma` (ảnh/PDF văn bằng)
3. `transcript` (ảnh/PDF bảng điểm)

### 2.3 Không đưa vào hash
- `status` (`PENDING/APPROVED/ISSUED/REVOKED`)
- `issuedAt`, `revokedAt`
- `createdAt`, `updatedAt`
- id nội bộ DB, log, metadata hệ thống

---

## 3) Quy tắc chuẩn hóa (canonicalization)

Áp dụng trước khi băm:

1. **Encoding**: UTF-8
2. **Line ending**: chỉ dùng `\n` (LF)
3. Chuỗi text:
   - `trim()` 2 đầu
   - thay nhiều khoảng trắng liên tiếp thành 1 khoảng trắng
4. `serialNo`, `studentId`:
   - `trim()`, bỏ khoảng trắng thừa, giữ nguyên ký tự
5. `studentName`, `major`:
   - giữ nguyên chữ hoa/thường (không tự đổi)
   - chỉ chuẩn hóa khoảng trắng
6. `birthDate`:
   - format cố định `YYYY-MM-DD`
7. `graduationYear`:
   - 4 chữ số, ví dụ `2025`
8. `gpa`:
   - chuyển sang số và format cố định 2 chữ số thập phân (ví dụ `3.50`)
9. `ranking`:
   - map về tập giá trị chuẩn: `XUAT_SAC | GIOI | KHA | TRUNG_BINH`
   - lưu canonical bằng đúng giá trị chuẩn ở trên

---

## 4) Canonical core string

Tạo chuỗi `canonicalCore` đúng thứ tự, mỗi dòng `key=value`:

serialNo={serialNo}\n
studentId={studentId}\n
studentName={studentName}\n
birthDate={birthDate}\n
major={major}\n
ranking={ranking}\n
gpa={gpa}\n
graduationYear={graduationYear}\n

> Lưu ý: có dấu `\n` ở cuối dòng cuối cùng.

---

## 5) Công thức RecordHash

Dùng SHA-256 trên dữ liệu ghép theo đúng thứ tự:

`recordHash = SHA256( UTF8(canonicalCore) || 0x1E || portraitBytes || 0x1F || diplomaBytes || 0x1F || transcriptBytes )`

Trong đó:
- `||` là nối bytes
- `0x1E`, `0x1F` là byte phân tách cố định để tránh nhập nhằng
- Kết quả xuất dạng hex lowercase 64 ký tự

---

## 6) Mã giả (Node.js)

```js
import crypto from "crypto";

function normSpaces(s = "") {
  return String(s).trim().replace(/\s+/g, " ");
}

function normDateYYYYMMDD(s = "") {
  // yêu cầu input đã là YYYY-MM-DD từ backend validation
  return normSpaces(s);
}

function normGpa(v) {
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error("gpa không hợp lệ");
  return n.toFixed(2);
}

function normRanking(v = "") {
  const x = normSpaces(v).toUpperCase();
  const map = {
    "XUẤT SẮC": "XUAT_SAC",
    "XUAT SAC": "XUAT_SAC",
    "GIỎI": "GIOI",
    "GIOI": "GIOI",
    "KHÁ": "KHA",
    "KHA": "KHA",
    "TRUNG BÌNH": "TRUNG_BINH",
    "TRUNG BINH": "TRUNG_BINH",
  };
  if (!map[x]) throw new Error("ranking không hợp lệ");
  return map[x];
}

function canonicalCore(core) {
  const data = {
    serialNo: normSpaces(core.serialNo),
    studentId: normSpaces(core.studentId),
    studentName: normSpaces(core.studentName),
    birthDate: normDateYYYYMMDD(core.birthDate),
    major: normSpaces(core.major),
    ranking: normRanking(core.ranking),
    gpa: normGpa(core.gpa),
    graduationYear: normSpaces(core.graduationYear),
  };

  return (
    `serialNo=${data.serialNo}\n` +
    `studentId=${data.studentId}\n` +
    `studentName=${data.studentName}\n` +
    `birthDate=${data.birthDate}\n` +
    `major=${data.major}\n` +
    `ranking=${data.ranking}\n` +
    `gpa=${data.gpa}\n` +
    `graduationYear=${data.graduationYear}\n`
  );
}

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function computeRecordHash(core, portraitBytes, diplomaBytes, transcriptBytes) {
  const coreBytes = Buffer.from(canonicalCore(core), "utf8");
  const sep1 = Buffer.from([0x1e]);
  const sep2 = Buffer.from([0x1f]);

  const payload = Buffer.concat([
    coreBytes, sep1,
    portraitBytes, sep2,
    diplomaBytes, sep2,
    transcriptBytes,
  ]);

  return sha256Hex(payload);
}

