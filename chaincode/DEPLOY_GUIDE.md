# 🚀 HƯỚNG DẪN DEPLOY CHAINCODE TỪ THƯMỤC /home/hoang/khoa-luan/chaincode

## 📍 Địa chỉ các file quan trọng

### 1. Hướng dẫn chi tiết:
```
/home/hoang/khoa-luan/docs/javascript_chaincode_guide.md
```

### 2. Chaincode của bạn:
```
/home/hoang/khoa-luan/chaincode/
├── README.md                    # Hướng dẫn cơ bản
├── DEPLOY_GUIDE.md             # File này
└── example-chaincode/           # Chaincode mẫu (sẵn sàng deploy!)
    ├── package.json
    ├── index.js
    ├── lib/
    │   └── exampleContract.js
    ├── Dockerfile
    └── .dockerignore
```

### 3. Fabric Network:
```
/home/hoang/khoa-luan/network/fabric-samples/test-network/
```

---

## ✅ CÂU TRẢ LỜI: CÓ! Bạn hoàn toàn có thể viết và deploy từ /home/hoang/khoa-luan/chaincode

---

## 🔧 CÁCH DEPLOY CHAINCODE TỪ THƯ MỤC CỦA BẠN

### Bước 1: Chuẩn bị chaincode

```bash
cd /home/hoang/khoa-luan/chaincode/example-chaincode

# Install dependencies (nếu chưa có node_modules)
npm install
```

### Bước 2: Di chuyển đến test-network

```bash
cd /home/hoang/khoa-luan/network/fabric-samples/test-network
```

### Bước 3: Khởi động network (nếu chưa chạy)

```bash
./network.sh down  # Clean up nếu có network cũ
./network.sh up createChannel -c mychannel
```

### Bước 4: Deploy chaincode từ thư mục của bạn

**Cách 1: Dùng đường dẫn tuyệt đối (KHUYẾN NGHỊ)**

```bash
./network.sh deployCCAAS \
  -ccn example \
  -ccp /home/hoang/khoa-luan/chaincode/example-chaincode
```

**Cách 2: Dùng đường dẫn tương đối**

```bash
# Từ test-network đến chaincode của bạn
./network.sh deployCCAAS \
  -ccn example \
  -ccp ../../../chaincode/example-chaincode
```

### Bước 5: Verify deployment

```bash
docker ps | grep example
# Bạn sẽ thấy chaincode containers đang chạy
```

---

## 🧪 TEST CHAINCODE

### Setup environment variables (chạy 1 lần)

```bash
cd /home/hoang/khoa-luan/network/fabric-samples/test-network

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

# Org1 environment
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

### Test các functions

**1. Init Ledger:**
```bash
peer chaincode invoke \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n example \
  --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"InitLedger","Args":[]}'
```

**2. Get All Items:**
```bash
peer chaincode query -C mychannel -n example \
  -c '{"function":"GetAllItems","Args":[]}'
```

**3. Create Item:**
```bash
peer chaincode invoke \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n example \
  --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"CreateItem","Args":["item3","New Item","My description","Charlie","300"]}'
```

**4. Read Item:**
```bash
peer chaincode query -C mychannel -n example \
  -c '{"function":"ReadItem","Args":["item1"]}'
```

**5. Update Item:**
```bash
peer chaincode invoke \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n example \
  --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"UpdateItem","Args":["item1","Updated Name","Updated Desc","999"]}'
```

**6. Transfer Item:**
```bash
peer chaincode invoke \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n example \
  --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"TransferItem","Args":["item1","Dave"]}'
```

**7. Get Items by Owner:**
```bash
peer chaincode query -C mychannel -n example \
  -c '{"function":"GetItemsByOwner","Args":["Alice"]}'
```

**8. Delete Item:**
```bash
peer chaincode invoke \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n example \
  --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"DeleteItem","Args":["item3"]}'
```

---

## 📝 TẠO CHAINCODE MỚI CHO KHÓA LUẬN

### Template nhanh:

```bash
# 1. Copy template
cp -r /home/hoang/khoa-luan/chaincode/example-chaincode \
      /home/hoang/khoa-luan/chaincode/my-thesis-chaincode

# 2. Chỉnh sửa package.json
cd /home/hoang/khoa-luan/chaincode/my-thesis-chaincode
nano package.json  # Đổi tên project

# 3. Viết logic trong lib/
nano lib/exampleContract.js  # hoặc tạo file mới

# 4. Install dependencies
npm install

# 5. Deploy
cd /home/hoang/khoa-luan/network/fabric-samples/test-network
./network.sh deployCCAAS \
  -ccn mythesis \
  -ccp /home/hoang/khoa-luan/chaincode/my-thesis-chaincode
```

---

## 🔍 DEBUGGING

### Xem logs của chaincode:

```bash
# Tìm container name
docker ps | grep mythesis

# Xem logs
docker logs peer0org1_mythesis_ccaas
docker logs peer0org2_mythesis_ccaas

# Follow logs real-time
docker logs -f peer0org1_mythesis_ccaas
```

### Xem peer logs:

```bash
docker logs peer0.org1.example.com
docker logs peer0.org2.example.com
```

---

## 🗂️ QUẢN LÝ NHIỀU CHAINCODE

Bạn có thể có nhiều chaincode cùng lúc:

```
/home/hoang/khoa-luan/chaincode/
├── asset-management/      # Chaincode 1
├── supply-chain/          # Chaincode 2
├── voting-system/         # Chaincode 3
└── example-chaincode/     # Chaincode mẫu
```

Deploy mỗi chaincode với tên khác nhau:

```bash
./network.sh deployCCAAS -ccn asset -ccp /home/hoang/khoa-luan/chaincode/asset-management
./network.sh deployCCAAS -ccn supply -ccp /home/hoang/khoa-luan/chaincode/supply-chain
./network.sh deployCCAAS -ccn voting -ccp /home/hoang/khoa-luan/chaincode/voting-system
```

---

## 💡 TIPS

1. **Luôn test local trước khi deploy**
2. **Dùng version control (git) cho chaincode**
3. **Thêm unit tests trong folder test/**
4. **Document tất cả functions**
5. **Validate input ở mọi function**
6. **Log đầy đủ để debug**

---

## 📚 TÀI LIỆU THAM KHẢO

- Hướng dẫn JS: `/home/hoang/khoa-luan/docs/javascript_chaincode_guide.md`
- Sample code: `/home/hoang/khoa-luan/chaincode/example-chaincode/`
- Fabric docs: https://hyperledger-fabric.readthedocs.io/

---

**Chúc bạn thành công với khóa luận! 🎓**
