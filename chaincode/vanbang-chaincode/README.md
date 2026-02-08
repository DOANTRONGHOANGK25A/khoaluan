# VanBang Chaincode - Quản lý văn bằng trên Hyperledger Fabric

## Mô tả
Chaincode quản lý văn bằng với các chức năng:
- **IssueDiploma**: Phát hành văn bằng mới
- **ReadDiploma**: Đọc thông tin văn bằng
- **RevokeDiploma**: Thu hồi văn bằng

## Cấu trúc dự án
```
vanbang-chaincode/
├── index.js                 # Entry point
├── lib/
│   └── vanbangContract.js   # Contract logic
├── package.json             # Node.js dependencies
├── Dockerfile              # Docker image cho CaaS mode
└── README.md               # File này
```

## Yêu cầu
- Hyperledger Fabric 2.5+
- Node.js 18+
- Docker
- Fabric network đang chạy

## Deploy với Chaincode-as-a-Service (CaaS) Mode

### Lý do sử dụng CaaS mode:
Do Docker version 29.2.1 không tương thích với Fabric peer khi build chaincode image (lỗi "broken pipe"), chúng ta sử dụng Chaincode-as-a-Service mode để tránh việc peer phải build Docker image.

### Các bước đã thực hiện:

#### 1. Chuẩn bị chaincode cho CaaS mode

**a. Cập nhật package.json:**
```json
{
  "scripts": {
    "start": "fabric-chaincode-node server --chaincode-address=$CHAINCODE_SERVER_ADDRESS --chaincode-id=$CHAINCODE_ID"
  },
  "dependencies": {
    "fabric-contract-api": "^2.5.0",
    "fabric-shim": "^2.5.0"
  }
}
```

**b. Tạo Dockerfile:**
```dockerfile
FROM node:18-alpine
ARG CC_SERVER_PORT
ENV PORT=$CC_SERVER_PORT
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:${CC_SERVER_PORT}
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE ${CC_SERVER_PORT}
CMD [ "npm", "start" ]
```

#### 2. Khởi động Fabric network
```bash
cd /home/hoang/khoa-luan/network/fabric-samples/test-network
./network.sh up createChannel -ca
```

#### 3. Deploy chaincode với CaaS mode
```bash
./network.sh deployCCAAS -ccn vanbang -ccp ../../../chaincode/vanbang-chaincode
```

### Quá trình deploy tự động thực hiện:

1. **Build Docker image** từ Dockerfile
   - Image: `vanbang_ccaas_image:latest`
   - Port: 9999

2. **Install chaincode package** lên các peer
   - Package ID: `vanbang_1.0:95a4408f177ec64a07bd0095f82d976ede850df46dc8aec265cda99df1f61408`
   - Installed trên: peer0.org1, peer0.org2

3. **Approve chaincode definition**
   - Org1MSP: ✓
   - Org2MSP: ✓

4. **Commit chaincode** lên channel
   - Channel: mychannel
   - Version: 1.0
   - Sequence: 1

5. **Start chaincode containers**
   - `peer0org1_vanbang_ccaas`
   - `peer0org2_vanbang_ccaas`

## Sử dụng Chaincode

### Thiết lập biến môi trường cho Org1:
```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config
```

### Ví dụ invoke chaincode:

**1. Phát hành văn bằng:**
```bash
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem \
  -C mychannel -n vanbang \
  --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem \
  --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem \
  -c '{"function":"IssueDiploma","Args":["VB001","a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890","2026-02-07T17:00:00Z"]}'
```

**2. Đọc văn bằng:**
```bash
peer chaincode query -C mychannel -n vanbang \
  -c '{"function":"ReadDiploma","Args":["VB001"]}'
```

**3. Thu hồi văn bằng:**
```bash
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem \
  -C mychannel -n vanbang \
  --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem \
  --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem \
  -c '{"function":"RevokeDiploma","Args":["VB001","2026-02-08T10:00:00Z"]}'
```

## Kiểm tra trạng thái

### Xem containers đang chạy:
```bash
docker ps | grep vanbang
```

### Xem logs của chaincode:
```bash
docker logs peer0org1_vanbang_ccaas
docker logs peer0org2_vanbang_ccaas
```

### Query chaincode definition:
```bash
peer lifecycle chaincode querycommitted --channelID mychannel --name vanbang
```

## Troubleshooting

### Lỗi "broken pipe" khi deploy với deployCC:
- **Nguyên nhân**: Docker version 29.2.1 không tương thích với Fabric peer
- **Giải pháp**: Sử dụng CaaS mode với lệnh `deployCCAAS`

### Chaincode container không start:
```bash
# Kiểm tra logs
docker logs peer0org1_vanbang_ccaas

# Restart container
docker restart peer0org1_vanbang_ccaas
```

### Update chaincode:
1. Thay đổi code trong lib/vanbangContract.js
2. Rebuild Docker image
3. Deploy lại với version mới:
```bash
./network.sh deployCCAAS -ccn vanbang -ccp ../../../chaincode/vanbang-chaincode -ccv 1.1
```

## Dọn dẹp

### Dừng chaincode containers:
```bash
docker stop peer0org1_vanbang_ccaas peer0org2_vanbang_ccaas
```

### Dừng network:
```bash
cd /home/hoang/khoa-luan/network/fabric-samples/test-network
./network.sh down
```

## Tài liệu tham khảo
- [Hyperledger Fabric Chaincode as a Service](https://hyperledger-fabric.readthedocs.io/en/latest/cc_service.html)
- [Fabric Test Network](https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html)
