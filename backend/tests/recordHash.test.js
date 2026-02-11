/**
 * Kiểm thử hàm tạo mã băm (recordHash) cho văn bằng.
 *
 * Mục đích: Đảm bảo rằng cùng một dữ liệu văn bằng sẽ luôn tạo ra
 *           cùng một mã băm (hash), bất kể dữ liệu đầu vào có bị
 *           thừa khoảng trắng, sai kiểu dữ liệu, v.v.
 *
 * Cách chạy:  node backend/tests/recordHash.test.js
 *             (không cần kết nối CSDL — chỉ kiểm tra hàm thuần túy)
 */
import crypto from "crypto";
import { buildCanonicalText, computeRecordHash, sha256Hex } from "../services/recordHash.js";

/* ── Dữ liệu mẫu ── */

// Giả lập nội dung file (ảnh chân dung, bằng PDF, bảng điểm)
const duLieuAnhChanDung = Buffer.from("fake-portrait-binary-content");
const duLieuBangPDF = Buffer.from("fake-diploma-binary-content");
const duLieuBangDiem = Buffer.from("fake-transcript-binary-content");

// Tính mã băm SHA-256 cho từng file
const hashAnhChanDung = sha256Hex(duLieuAnhChanDung);
const hashBangPDF = sha256Hex(duLieuBangPDF);
const hashBangDiem = sha256Hex(duLieuBangDiem);

// Thông tin văn bằng mẫu (dữ liệu "sạch", đúng định dạng)
const thongTinMau = {
    serialNo: "VB001",
    studentId: "SV001",
    studentName: "Nguyễn Văn A",
    birthDate: "2000-01-15",
    major: "Công nghệ thông tin",
    ranking: "Giỏi",
    gpa: "3.8",           // sẽ được chuẩn hóa thành "3.80"
    graduationYear: 2024,  // số nguyên → sẽ chuyển thành chuỗi "2024"
    portraitSha256: hashAnhChanDung,
    diplomaSha256: hashBangPDF,
    transcriptSha256: hashBangDiem,
};

/* ── Hàm hỗ trợ đếm kết quả kiểm thử ── */

let soDat = 0;
let soLoi = 0;

function kiemTra(dieuKien, moTa) {
    if (dieuKien) {
        soDat++;
        console.log(`  ✓ ${moTa}`);
    } else {
        soLoi++;
        console.error(`  ✗ ${moTa}`);
    }
}

/* ══════════════════════════════════════════════
   CÁC BÀI KIỂM THỬ
   ══════════════════════════════════════════════ */

console.log("\n=== Kiểm thử mã băm văn bằng (recordHash) ===\n");

// ─────────────────────────────────────────────
// 1. Kiểm tra chuỗi chuẩn hóa (canonical text) có đúng định dạng
// ─────────────────────────────────────────────
console.log("1) Kiểm tra định dạng chuỗi chuẩn hóa");
const chuoiChuan = buildCanonicalText(thongTinMau);
const cacDong = chuoiChuan.split("\n");

kiemTra(cacDong.length === 11, "Phải có đúng 11 dòng");
kiemTra(cacDong[0] === "serialNo=VB001", "Dòng 1: Số hiệu văn bằng");
kiemTra(cacDong[1] === "studentId=SV001", "Dòng 2: Mã sinh viên");
kiemTra(cacDong[2] === "studentName=Nguyễn Văn A", "Dòng 3: Họ tên sinh viên");
kiemTra(cacDong[3] === "birthDate=2000-01-15", "Dòng 4: Ngày sinh");
kiemTra(cacDong[4] === "major=Công nghệ thông tin", "Dòng 5: Ngành học");
kiemTra(cacDong[5] === "ranking=Giỏi", "Dòng 6: Xếp loại");
kiemTra(cacDong[6] === "gpa=3.80", "Dòng 7: Điểm GPA (làm tròn 2 chữ số thập phân)");
kiemTra(cacDong[7] === "graduationYear=2024", "Dòng 8: Năm tốt nghiệp (chuyển thành chuỗi)");
kiemTra(cacDong[8] === `portraitSha256=${hashAnhChanDung}`, "Dòng 9: Hash ảnh chân dung");
kiemTra(cacDong[9] === `diplomaSha256=${hashBangPDF}`, "Dòng 10: Hash file bằng PDF");
kiemTra(cacDong[10] === `transcriptSha256=${hashBangDiem}`, "Dòng 11: Hash bảng điểm");

// ─────────────────────────────────────────────
// 2. Tính ổn định: cùng đầu vào → luôn ra cùng mã băm
// ─────────────────────────────────────────────
console.log("\n2) Kiểm tra tính ổn định (cùng dữ liệu → cùng hash)");
const hash1 = computeRecordHash(buildCanonicalText(thongTinMau));
const hash2 = computeRecordHash(buildCanonicalText(thongTinMau));
const hash3 = computeRecordHash(buildCanonicalText(thongTinMau));

kiemTra(hash1 === hash2, "Lần băm 1 === Lần băm 2");
kiemTra(hash2 === hash3, "Lần băm 2 === Lần băm 3");
kiemTra(/^[0-9a-f]{64}$/.test(hash1), "Mã băm là chuỗi hex 64 ký tự (SHA-256)");
console.log(`   Mã băm mẫu = ${hash1}`);

// ─────────────────────────────────────────────
// 3. Chuẩn hóa: dữ liệu "bẩn" vẫn phải ra cùng hash
//    (thừa khoảng trắng, sai kiểu dữ liệu, v.v.)
// ─────────────────────────────────────────────
console.log("\n3) Kiểm tra chuẩn hóa dữ liệu đầu vào");

const duLieuBan = {
    ...thongTinMau,
    serialNo: "  VB001  ",                              // thừa khoảng trắng đầu/cuối
    studentName: " Nguyễn  Văn   A ",                   // thừa khoảng trắng giữa các từ
    gpa: 3.8,                                           // kiểu số thay vì chuỗi
    graduationYear: "2024",                              // kiểu chuỗi thay vì số
    birthDate: new Date("2000-01-15T00:00:00Z"),         // đối tượng Date thay vì chuỗi
};

const chuoiChuanBan = buildCanonicalText(duLieuBan);
const hashBan = computeRecordHash(chuoiChuanBan);

kiemTra(hashBan === hash1, "Dữ liệu 'bẩn' sau chuẩn hóa → cùng hash với dữ liệu 'sạch'");

// ─────────────────────────────────────────────
// 4. Ký tự xuống dòng trong tên phải được gộp thành khoảng trắng
// ─────────────────────────────────────────────
console.log("\n4) Kiểm tra xử lý ký tự xuống dòng trong tên");
const coXuongDong = { ...thongTinMau, studentName: "Nguyễn\nVăn\r\nA" };
const chuoiXuongDong = buildCanonicalText(coXuongDong);
kiemTra(chuoiXuongDong.includes("studentName=Nguyễn Văn A"), "Ký tự xuống dòng được gộp thành khoảng trắng");

// ─────────────────────────────────────────────
// 5. Trường null/undefined phải trả về giá trị rỗng
// ─────────────────────────────────────────────
console.log("\n5) Kiểm tra xử lý giá trị null/undefined");
const coGiaTriNull = {
    serialNo: "VB002",
    studentId: "SV002",
    studentName: "Test",
    birthDate: null,          // null
    major: undefined,         // undefined
    ranking: null,
    gpa: null,
    graduationYear: null,
    portraitSha256: hashAnhChanDung,
    diplomaSha256: hashBangPDF,
    transcriptSha256: hashBangDiem,
};
const chuoiNull = buildCanonicalText(coGiaTriNull);
const cacDongNull = chuoiNull.split("\n");
kiemTra(cacDongNull[3] === "birthDate=", "Ngày sinh null → giá trị rỗng");
kiemTra(cacDongNull[4] === "major=", "Ngành học undefined → giá trị rỗng");
kiemTra(cacDongNull[6] === "gpa=", "GPA null → giá trị rỗng");
kiemTra(cacDongNull[7] === "graduationYear=", "Năm tốt nghiệp null → giá trị rỗng");

// ─────────────────────────────────────────────
// 6. Dữ liệu khác nhau → hash phải khác nhau
// ─────────────────────────────────────────────
console.log("\n6) Kiểm tra: dữ liệu khác → hash khác");
const duLieuKhac = { ...thongTinMau, serialNo: "VB999" };
const hashKhac = computeRecordHash(buildCanonicalText(duLieuKhac));
kiemTra(hashKhac !== hash1, "Đổi số hiệu văn bằng → mã băm thay đổi");

// ─────────────────────────────────────────────
// 7. File đính kèm khác → hash phải khác
// ─────────────────────────────────────────────
console.log("\n7) Kiểm tra: file khác → hash khác");
const coFileKhac = { ...thongTinMau, portraitSha256: sha256Hex(Buffer.from("different-portrait")) };
const hashFileKhac = computeRecordHash(buildCanonicalText(coFileKhac));
kiemTra(hashFileKhac !== hash1, "Ảnh chân dung khác → mã băm thay đổi");

/* ── Tổng kết ── */
console.log(`\n=== Kết quả: ${soDat} đạt, ${soLoi} lỗi ===\n`);
process.exit(soLoi > 0 ? 1 : 0);
