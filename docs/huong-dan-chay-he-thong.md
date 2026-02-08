# Hướng Dẫn Chạy Hệ Thống Xác Thực Văn Bằng

## Yêu cầu cài đặt

| Phần mềm       | Phiên bản  | Kiểm tra                  |
|-----------------|-----------|---------------------------|
| Node.js         | >= 18     | `node -v`                 |
| npm             | >= 9      | `npm -v`                  |
| Docker          | >= 20     | `docker -v`               |
| Docker Compose  | >= 2      | `docker compose version`  |
| PostgreSQL      | >= 14     | `psql --version`          |

---

## Bước 1: Khởi tạo Database (PostgreSQL)

```bash
# Tạo database
sudo -u postgres createdb qlvanbang

# Chạy schema (tạo bảng + seed users)
cd /home/hoang/khoa-luan/backend
psql -U postgres -d qlvanbang -f schema.sql
```

File `.env` backend đã cấu hình sẵn:
```
DATABASE_URL=postgresql://postgres:a@localhost:5432/qlvanbang
```

> Nếu mật khẩu postgres khác `a`, hãy sửa lại trong `backend/.env`.

### Tài khoản mặc định (sau khi chạy schema.sql)

| Username  | Password      | Role    | Chức năng                          |
|-----------|---------------|---------|-------------------------------------|
| admin     | Admin@123     | ADMIN   | Quản lý users                      |
| staff01   | Staff@123     | STAFF   | Tạo hồ sơ văn bằng                |
| manager   | Manager@123   | MANAGER | Duyệt / từ chối hồ sơ             |
| issuer    | Issuer@123    | ISSUER  | Phát hành / thu hồi lên blockchain |

---

## Bước 2: Khởi tạo Fabric Network + Deploy Chaincode

**Đây là bước quan trọng nhất — phải chạy trước khi dùng chức năng blockchain.**

```bash
cd /home/hoang/khoa-luan/chaincode
bash DEPLOY.sh
```

Script này tự động:
1. Dọn network cũ (`./network.sh down`)
2. Khởi tạo test-network với 2 peer + 1 orderer + CA (`./network.sh up createChannel -ca`)
3. Deploy chaincode `vanbang` lên channel `mychannel`

**Kiểm tra thành công:**
```bash
docker ps | grep vanbang
# Phải thấy 2 container: peer0org1_vanbang_ccaas, peer0org2_vanbang_ccaas
```

> Thời gian chạy: ~2-5 phút tùy máy.

---

## Bước 3: Cài dependencies + Chạy Backend

```bash
cd /home/hoang/khoa-luan/backend
npm install
npm run dev
```

Backend chạy tại: `http://localhost:3001`

Kiểm tra: `curl http://localhost:3001/api/health` → `{"ok":true}`

---

## Bước 4: Cài dependencies + Chạy Frontend

```bash
cd /home/hoang/khoa-luan/frontend
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

> Vite proxy tự động forward `/api/*` → `http://localhost:3001`

---

## Quy trình sử dụng (theo thứ tự)

### 4.1. STAFF tạo hồ sơ văn bằng

1. Đăng nhập: `staff01 / Staff@123`
2. Vào **Tạo hồ sơ** → điền thông tin sinh viên + upload 3 file (ảnh chân dung, file văn bằng, bảng điểm)
3. Bấm **Tạo** → hồ sơ ở trạng thái `PENDING`

### 4.2. MANAGER duyệt hồ sơ

1. Đăng nhập: `manager / Manager@123`
2. Vào **Phê duyệt** → xem danh sách hồ sơ PENDING
3. Bấm **Duyệt** hoặc **Từ chối**
4. Hồ sơ chuyển sang `APPROVED` hoặc bị ghi log từ chối

### 4.3. ISSUER tạo wallet + phát hành lên blockchain

**Bước a: Tạo wallet**

1. Đăng nhập: `issuer / Issuer@123`
2. Vào **Phát hành & Thu hồi**
3. Bấm nút **"Tạo Wallet"** (góc phải header)
4. Trình duyệt tải về file `wallet.json` — **lưu lại file này**

> Wallet chứa certificate + private key dùng để ký giao dịch blockchain.
> Endpoint sẽ kiểm tra network đang chạy trước khi cho tạo wallet.
> Nếu thấy lỗi "Không thể kết nối Fabric network" → chạy lại Bước 2.

**Bước b: Phát hành văn bằng**

1. Trong tab **"Chờ phát hành"** → bấm **"Phát hành"** trên hồ sơ APPROVED
2. Modal hiện ra → chọn file `wallet.json` vừa tải
3. Bấm **"Phát hành"**
4. Backend dùng cert/key trong wallet để ký giao dịch `IssueDiploma` lên blockchain
5. Hồ sơ chuyển sang `ISSUED`

**Bước c: Thu hồi văn bằng (nếu cần)**

1. Trong tab **"Đã phát hành"** → bấm **"Thu hồi"**
2. Upload `wallet.json` → bấm xác nhận
3. Backend ký giao dịch `RevokeDiploma` lên blockchain
4. Hồ sơ chuyển sang `REVOKED`

### 4.4. Tra cứu công khai (không cần đăng nhập)

1. Vào trang `http://localhost:5173/verify`
2. Chọn loại tra cứu:
   - **Số hiệu văn bằng** (VD: `VB001`) → trả 1 kết quả
   - **Mã sinh viên** (VD: `SV001`) → trả danh sách
   - **Tên sinh viên** (VD: `Nguyen`) → tìm gần đúng
3. Hệ thống tự động:
   - Tính `recordHash` từ dữ liệu off-chain (DB + files)
   - Đọc `recordHash` trên blockchain
   - So sánh → hiển thị **MATCH** (xanh) hoặc **MISMATCH** (đỏ)

---

## Cấu trúc thư mục dự án

```
khoa-luan/
├── backend/                  # API server (Node.js + Express)
│   ├── .env                  # Cấu hình DB + Fabric
│   ├── schema.sql            # Tạo bảng + seed users
│   ├── src/
│   │   ├── app.js            # Express app
│   │   ├── db.js             # PostgreSQL pool
│   │   └── server.js         # Khởi động server
│   ├── routes/
│   │   ├── auth.js           # Đăng nhập / đăng xuất
│   │   ├── diplomas.js       # CRUD hồ sơ + issue/revoke
│   │   ├── chain.js          # Đọc on-chain
│   │   ├── public.js         # Verify công khai
│   │   ├── issuer.js         # Tạo wallet
│   │   └── users.js          # Quản lý users
│   ├── services/
│   │   ├── fabricClient.js   # Kết nối Fabric gateway
│   │   ├── fabricDiploma.js  # Issue/Revoke/Read chaincode
│   │   └── recordHash.js     # Tính SHA-256 recordHash
│   └── middlewares/
│       ├── auth.js           # Xác thực token
│       └── role.js           # Phân quyền role
│
├── frontend/                 # Giao diện (React + Vite + Ant Design)
│   └── src/
│       ├── api/              # Axios API calls
│       ├── pages/            # Các trang
│       └── router/           # React Router
│
├── chaincode/                # Smart contract
│   ├── DEPLOY.sh             # Script deploy tự động
│   └── vanbang-chaincode/    # Chaincode JavaScript
│       └── lib/vanbangContract.js
│
├── network/                  # Hyperledger Fabric test-network
│   └── fabric-samples/test-network/
│
└── docs/                     # Tài liệu
```

---

## API Endpoints

### Không cần auth
| Method | URL                     | Mô tả                              |
|--------|-------------------------|--------------------------------------|
| GET    | /api/health             | Health check                        |
| GET    | /api/public/verify      | Tra cứu văn bằng (serialNo/studentId/studentName) |

### Cần auth (Bearer token)
| Method | URL                              | Role    | Mô tả                        |
|--------|----------------------------------|---------|-------------------------------|
| POST   | /api/auth/login                  | *       | Đăng nhập                    |
| POST   | /api/diplomas                    | STAFF   | Tạo hồ sơ (multipart)        |
| PUT    | /api/diplomas/:id                | STAFF   | Sửa hồ sơ PENDING            |
| GET    | /api/diplomas                    | ALL*    | Danh sách hồ sơ              |
| GET    | /api/diplomas/:id                | ALL*    | Chi tiết hồ sơ               |
| POST   | /api/diplomas/:id/approve        | MANAGER | Duyệt hồ sơ                  |
| POST   | /api/diplomas/:id/reject         | MANAGER | Từ chối hồ sơ                |
| POST   | /api/diplomas/:id/issue          | ISSUER  | Phát hành (upload wallet)     |
| POST   | /api/diplomas/:id/revoke         | ISSUER  | Thu hồi (upload wallet)       |
| POST   | /api/issuer/wallet               | ISSUER  | Tạo wallet.json              |

> ALL* = ADMIN, STAFF, MANAGER, ISSUER

---

## Xử lý sự cố

### Lỗi "Không thể kết nối Fabric network"
```bash
# Kiểm tra containers
docker ps | grep -E "peer|orderer|vanbang"

# Nếu không có → chạy lại
cd /home/hoang/khoa-luan/chaincode
bash DEPLOY.sh
```

### Sau khi tắt máy / restart Docker
```bash
cd /home/hoang/khoa-luan/network/fabric-samples/test-network

# Thử start lại containers cũ
docker start $(docker ps -aq --filter "label=com.docker.compose.project")

# Nếu không được → chạy lại DEPLOY.sh từ đầu
# (Lưu ý: dữ liệu on-chain sẽ mất, cần phát hành lại)
```

### Backend không kết nối được DB
```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Kiểm tra database tồn tại
psql -U postgres -l | grep qlvanbang

# Tạo lại nếu cần
sudo -u postgres createdb qlvanbang
psql -U postgres -d qlvanbang -f backend/schema.sql
```

### Frontend báo lỗi 401 liên tục
Token hết hạn (mặc định 480 phút). Đăng nhập lại.

---

## Biến môi trường (.env)

File `backend/.env`:
```
PORT=3001
DATABASE_URL=postgresql://postgres:a@localhost:5432/qlvanbang
SESSION_TTL_MINUTES=480

FABRIC_CHANNEL=mychannel
FABRIC_CHAINCODE=vanbang
FABRIC_MSPID=Org1MSP
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_PEER_HOST_ALIAS=peer0.org1.example.com

FABRIC_TLS_CERT_PATH=../network/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
FABRIC_CERT_PATH=../network/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem
FABRIC_KEY_DIR=../network/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore
```

> Các đường dẫn `FABRIC_*` trỏ tới file được tạo ra bởi test-network. Chỉ tồn tại sau khi chạy `DEPLOY.sh`.

---

## Luồng dữ liệu khi phát hành

```
ISSUER bấm "Phát hành" + upload wallet.json
        │
        ▼
Frontend gửi POST /api/diplomas/:id/issue  (multipart: walletFile)
        │
        ▼
Backend parse wallet.json → lấy { mspId, certificate, privateKey }
        │
        ▼
Tính recordHash = SHA256(canonical text gồm thông tin SV + SHA256 mỗi file)
        │
        ▼
Tạo Fabric gateway tạm bằng cert/key từ wallet
        │
        ▼
submitTransaction("IssueDiploma", serialNo, recordHash, issuedAt)
        │
        ▼
Chaincode ghi lên ledger: { serialNo, recordHash, status: "ISSUED", txId }
        │
        ▼
Đóng gateway tạm
        │
        ▼
Cập nhật DB: status = "ISSUED" + ghi chain_logs
        │
        ▼
Trả response cho frontend
```

---

## Luồng dữ liệu khi tra cứu (Verify)

```
Người dùng nhập từ khóa tra cứu (serialNo / studentId / studentName)
        │
        ▼
Frontend gửi GET /api/public/verify?serialNo=VB001
        │
        ▼
Backend tìm trong DB → danh sách diplomas khớp
        │
        ▼
Với mỗi diploma:
  ├── Tính computedRecordHash từ DB + files
  └── Gọi chaincode ReadDiploma → lấy onchainRecordHash
        │
        ▼
So sánh: match = (computedRecordHash === onchainRecordHash)
        │
        ▼
Trả về mảng kết quả với trạng thái MATCH / MISMATCH
```
