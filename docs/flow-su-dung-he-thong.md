# Flow Sử Dụng Hệ Thống Từ Đầu Đến Cuối

## Tổng quan 3 bước chính

```
┌──────────────────────────────────────────────────────────────┐
│  BƯỚC 1: KHỞI TẠO HỆ THỐNG (1 lần duy nhất)                 │
│  ├─ Tạo database + import schema                             │
│  ├─ Deploy Fabric network + chaincode vanbang                │
│  └─ Chạy backend + frontend                                  │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  BƯỚC 2: PHÁT HÀNH VĂN BẰNG LÊN BLOCKCHAIN                   │
│  ├─ STAFF: Tạo hồ sơ văn bằng                                │
│  ├─ MANAGER: Duyệt hồ sơ                                     │
│  ├─ ISSUER: Tạo wallet                                       │
│  └─ ISSUER: Phát hành (upload wallet)                        │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  BƯỚC 3: TRA CỨU & XÁC THỰC (công khai)                     │
│  └─ Nhập serialNo/studentId/studentName → Xem MATCH/MISMATCH │
└──────────────────────────────────────────────────────────────┘
```

---

## BƯỚC 1: KHỞI TẠO HỆ THỐNG (Chỉ chạy 1 lần)

### 1.1. Tạo Database PostgreSQL

```bash
# Tạo database
sudo -u postgres createdb qlvanbang

# Import schema (tạo bảng + 4 users mặc định)
cd /home/hoang/khoa-luan/backend
psql -U postgres -d qlvanbang -f schema.sql
```

**Kết quả:** Database `qlvanbang` có 5 bảng + 4 users (admin, staff01, manager, issuer)

---

### 1.2. Deploy Blockchain Network

**Lệnh duy nhất:**
```bash
cd /home/hoang/khoa-luan/chaincode
bash DEPLOY.sh
```

**Script tự động làm:**
- Dọn network cũ
- Khởi động Fabric test-network (2 peer + 1 orderer + CA)
- Tạo channel `mychannel`
- Deploy chaincode `vanbang`

**Kiểm tra thành công:**
```bash
docker ps | grep vanbang
# Phải thấy 2 containers: peer0org1_vanbang_ccaas, peer0org2_vanbang_ccaas
```

⏱️ **Thời gian:** ~3-5 phút

---

### 1.3. Chạy Backend + Frontend

**Terminal 1 (Backend):**
```bash
cd /home/hoang/khoa-luan/backend
npm install
npm run dev
```
→ Chạy tại `http://localhost:3001`

**Terminal 2 (Frontend):**
```bash
cd /home/hoang/khoa-luan/frontend
npm install
npm run dev
```
→ Chạy tại `http://localhost:5173`

**Kiểm tra:**
- Truy cập `http://localhost:5173` → thấy trang Login

---

## BƯỚC 2: PHÁT HÀNH VĂN BẰNG LÊN BLOCKCHAIN

### Timeline

```
STAFF           MANAGER         ISSUER          BLOCKCHAIN
  │                                                 
  ├─► Tạo hồ sơ                                    
  │   (PENDING)                                     
  │                                                 
  │──────────────►│                                 
                  │                                 
                  ├─► Duyệt hồ sơ                   
                  │   (APPROVED)                    
                  │                                 
                  │───────────────►│                
                                   │                
                                   ├─► Tạo wallet  
                                   │   ↓            
                                   │   wallet.json  
                                   │                
                                   ├─► Phát hành   
                                   │   + upload wallet
                                   │                
                                   │───────────────►│
                                                    │
                                                    ├─► Ghi ledger
                                                    │   (ISSUED)
                                                    │
                                                    └─► txId + recordHash
```

---

### 2.1. STAFF tạo hồ sơ văn bằng

**Đăng nhập:** `staff01 / Staff@123`

**Các bước:**

1. Vào menu **"Tạo hồ sơ"**
2. Điền thông tin:
   - Số hiệu văn bằng: `VB2025-001`
   - Mã sinh viên: `SV001`
   - Tên SV: `Nguyễn Văn A`
   - Ngày sinh, ngành, xếp loại, GPA, năm tốt nghiệp
3. Upload 3 file bắt buộc:
   - **Ảnh chân dung** (JPG/PNG)
   - **File văn bằng** (PDF/JPG)
   - **Bảng điểm** (PDF/JPG)
4. Bấm **"Tạo hồ sơ"**

**Kết quả:**
- Hồ sơ ở trạng thái `PENDING`
- Files được lưu dạng BYTEA trong database
- STAFF có thể sửa thông tin khi còn PENDING

---

### 2.2. MANAGER duyệt hồ sơ

**Đăng nhập:** `manager / Manager@123`

**Các bước:**

1. Vào menu **"Phê duyệt"**
2. Xem danh sách hồ sơ PENDING
3. Click vào 1 hồ sơ → xem chi tiết (thông tin + 3 files)
4. Bấm **"Duyệt"** hoặc **"Từ chối"**

**Kết quả:**
- Nếu duyệt: `status = APPROVED`
- Nếu từ chối: Ghi log vào `approval_logs` (không đổi status)

---

### 2.3. ISSUER tạo wallet

**Đăng nhập:** `issuer / Issuer@123`

**Các bước:**

1. Vào menu **"Phát hành & Thu hồi"**
2. Bấm nút **"Tạo Wallet"** (góc phải trên)
3. Hệ thống kiểm tra:
   - ✅ File cert/key tồn tại (network đã khởi tạo)
   - ✅ Peer đang chạy (thử ping chaincode)
4. Trình duyệt tự động tải file `wallet.json`

**Nội dung wallet.json:**
```json
{
  "mspId": "Org1MSP",
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

**⚠️ Lưu ý quan trọng:**
- File này chứa **private key** → giữ bí mật
- Mỗi lần phát hành/thu hồi đều cần upload file này
- Nếu network đã tắt → endpoint trả lỗi `503` kèm hướng dẫn chạy lại

---

### 2.4. ISSUER phát hành văn bằng lên blockchain

**Tiếp tục ở trang "Phát hành & Thu hồi"**

**Các bước:**

1. Chọn tab **"Chờ phát hành"** → thấy danh sách hồ sơ APPROVED
2. Bấm nút **"Phát hành"** trên hồ sơ cần phát hành
3. Modal hiện ra: **"Phát hành — Upload Wallet"**
4. Chọn file `wallet.json` vừa tải ở bước 2.3
5. Bấm **"Phát hành"**

**Điều gì xảy ra bên trong:**

```
Frontend gửi FormData { walletFile: File }
        │
        ▼
Backend: POST /api/diplomas/:id/issue
        │
        ├─► Parse wallet.json → { mspId, certificate, privateKey }
        ├─► Tính recordHash từ:
        │   • Thông tin SV (serialNo, studentId, name, birthDate, major, ranking, gpa, year)
        │   • SHA256(file ảnh chân dung)
        │   • SHA256(file văn bằng)
        │   • SHA256(file bảng điểm)
        │   → recordHash = SHA256(canonical text)
        │
        ├─► Tạo gateway tạm bằng cert/key từ wallet
        ├─► submitTransaction("IssueDiploma", serialNo, recordHash, issuedAt)
        │         │
        │         └──► Chaincode ghi lên ledger:
        │               { serialNo, recordHash, status: "ISSUED", issuedAt, txId }
        │
        ├─► Đóng gateway tạm
        ├─► UPDATE diplomas SET status='ISSUED', issued_at=now()
        └─► INSERT chain_logs (action='ISSUE', tx_id, record_hash)
```

**Kết quả:**
- Hồ sơ chuyển sang `ISSUED`
- On-chain lưu: `{ serialNo, recordHash, status: "ISSUED", txId }`
- Có thể xem txId trong tab "Đã phát hành"

---

### 2.5. (Tùy chọn) ISSUER thu hồi văn bằng

**Khi nào dùng:** Phát hiện văn bằng giả, hủy bỏ,...

**Các bước:**

1. Trong tab **"Đã phát hành"**
2. Bấm **"Thu hồi"** trên hồ sơ ISSUED
3. Upload lại `wallet.json`
4. Bấm xác nhận

**Kết quả:**
- Hồ sơ chuyển sang `REVOKED`
- On-chain cập nhật: `status = "REVOKED", revokedAt = ...`

---

## BƯỚC 3: TRA CỨU & XÁC THỰC CÔNG KHAI

### Ai có thể tra cứu?

**Bất kỳ ai** — không cần đăng nhập, truy cập tự do tại:
```
http://localhost:5173/verify
```

---

### Cách tra cứu

**Bước 1:** Chọn loại tra cứu (dropdown)
- **Số hiệu văn bằng** (chính xác, trả 1 kết quả)
- **Mã sinh viên** (tìm tất cả văn bằng của 1 sinh viên)
- **Tên sinh viên** (tìm gần đúng, VD: "Nguyen" → tất cả tên có chứa)

**Bước 2:** Nhập từ khóa
- VD: `VB2025-001` hoặc `SV001` hoặc `Nguyen Van A`

**Bước 3:** Bấm **"Tra cứu"**

---

### Hệ thống xử lý

```
API: GET /api/public/verify?serialNo=VB2025-001
        │
        ├─► Tìm trong database → diploma record
        │
        ├─► Tính computedRecordHash:
        │   • Lấy thông tin SV từ DB
        │   • Lấy 3 files từ DB
        │   • SHA256(canonical text)  → recordHash1
        │
        ├─► Gọi chaincode: ReadDiploma(serialNo)
        │   → Lấy onchainRecordHash    → recordHash2
        │
        ├─► So sánh:
        │   match = (recordHash1 === recordHash2)
        │
        └─► Trả kết quả:
            {
              serialNo, studentId, studentName, status,
              computedRecordHash,
              onchainRecordHash,
              onchainStatus,
              match: true/false
            }
```

---

### Kết quả hiển thị

**Bảng danh sách với cột:**

| Số hiệu    | Mã SV  | Tên SV      | Trạng thái | On-chain | Xác thực     |
|------------|--------|-------------|-----------|----------|--------------|
| VB2025-001 | SV001  | Nguyễn Văn A| ISSUED    | ISSUED   | ✅ **MATCH** |

**Màu sắc:**
- **MATCH** = Tag xanh (hợp lệ)
- **MISMATCH** = Tag đỏ (dữ liệu bị sửa đổi hoặc giả mạo)

---

## Câu hỏi thường gặp

### Q1: Khi nào recordHash MISMATCH?

**Trường hợp A:** Ai đó sửa trực tiếp database sau khi đã phát hành
- VD: Sửa tên sinh viên, GPA,...
- → Hash tính lại khác hash on-chain

**Trường hợp B:** File bị thay thế
- VD: Đổi ảnh chân dung, file văn bằng
- → SHA256(file mới) ≠ SHA256(file cũ) → recordHash khác

**Trường hợp C:** Văn bằng giả mạo (không tồn tại on-chain)
- → onchainRecordHash = null
- → match = false

### Q2: Wallet.json có thể dùng chung không?

**Có** — 1 wallet có thể dùng cho nhiều lần phát hành/thu hồi.

Nhưng trong production thật, nên:
- Mỗi ISSUER đăng ký 1 identity riêng qua Fabric CA
- Hoặc dùng HSM (Hardware Security Module) để bảo vệ private key

### Q3: Tắt máy có mất dữ liệu không?

**Database (PostgreSQL):** Không mất — dữ liệu lưu trên ổ cứng

**Blockchain:** Mất nếu docker containers bị xóa
- Test-network không persist dữ liệu
- Production cần config volume mount

**Cách khôi phục:**
```bash
# Nếu containers còn (chỉ stopped)
docker start $(docker ps -aq)

# Nếu containers mất → chạy lại DEPLOY.sh
# → Cần phát hành lại tất cả văn bằng
```

### Q4: Làm sao kiểm tra blockchain thật sự có dữ liệu?

```bash
cd /home/hoang/khoa-luan/network/fabric-samples/test-network

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Đọc trực tiếp từ chaincode
peer chaincode query -C mychannel -n vanbang \
  -c '{"function":"ReadDiploma","Args":["VB2025-001"]}'
```

**Kết quả mẫu:**
```json
{
  "serialNo": "VB2025-001",
  "recordHash": "a1b2c3d4e5f6...",
  "status": "ISSUED",
  "issuedAt": "2026-02-08T10:30:00.000Z",
  "revokedAt": null,
  "txId": "abc123def456..."
}
```

---

## Tóm tắt quy trình hoàn chỉnh

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Khởi tạo hệ thống (1 lần)                                │
│    └─ DEPLOY.sh → Network + Chaincode                       │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Phát hành văn bằng                                       │
│    ├─ STAFF: Tạo hồ sơ + upload files                       │
│    ├─ MANAGER: Duyệt                                        │
│    ├─ ISSUER: Tạo wallet                                    │
│    └─ ISSUER: Phát hành (upload wallet)                     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Tra cứu công khai                                        │
│    └─ Nhập serialNo → MATCH/MISMATCH                        │
└─────────────────────────────────────────────────────────────┘
```

**Thời gian ước tính mỗi bước:**
- Bước 1: 5-10 phút (chỉ 1 lần)
- Bước 2: 2-3 phút/văn bằng
- Bước 3: < 5 giây/tra cứu

---

## Ghi chú bảo mật

1. **Wallet.json chứa private key** → Không commit lên git, không share
2. **Production cần**:
   - HTTPS cho frontend/backend
   - Fabric CA để đăng ký identity động
   - HSM hoặc key vault để lưu private key
   - Rate limiting cho API verify
3. **Session token** hết hạn sau 480 phút (8 giờ) — có thể sửa trong `.env`
