#!/bin/bash

# Script để deploy chaincode vanbang cho khóa luận
# Chạy: cd /home/hoang/khoa-luan/chaincode && bash DEPLOY.sh

set -e

NETWORK_DIR="/home/hoang/khoa-luan/network/fabric-samples/test-network"
CHAINCODE_DIR="/home/hoang/khoa-luan/chaincode/vanbang-chaincode"

CC_NAME="vanbang"

echo "📦 Bước 0: Install chaincode dependencies..."
cd "$CHAINCODE_DIR"
npm install --production
cd "$NETWORK_DIR"

echo ""
echo "🧹 Bước 0.5: Dọn dẹp container ccaas cũ (tránh name conflict)..."
docker stop peer0org1_${CC_NAME}_ccaas peer0org2_${CC_NAME}_ccaas 2>/dev/null || true
docker rm -f peer0org1_${CC_NAME}_ccaas peer0org2_${CC_NAME}_ccaas 2>/dev/null || true
# Dọn tất cả container ccaas còn sót
docker rm -f $(docker ps -aq --filter name=ccaas) 2>/dev/null || true

echo ""
echo "🔧 Bước 1: Dọn dẹp network cũ..."
./network.sh down

echo ""
echo "🚀 Bước 2: Khởi động network + tạo channel (có CA)..."
./network.sh up createChannel -ca

echo ""
echo "📦 Bước 3: Deploy chaincode 'vanbang'..."
./network.sh deployCCAAS -ccn "$CC_NAME" -ccp "$CHAINCODE_DIR"

echo ""
echo "✅ HOÀN TẤT! Fabric network đang chạy + chaincode 'vanbang' đã deploy."
echo ""
echo "📝 Kiểm tra nhanh:"
echo "   docker ps | grep vanbang"
echo ""
echo "🔑 File cert/key tại:"
echo "   Cert: $NETWORK_DIR/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem"
echo "   Key:  $NETWORK_DIR/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/"
echo ""
echo "🌐 Sau khi deploy, khởi động backend:"
echo "   cd /home/hoang/khoa-luan/backend && npm run dev"
echo ""
echo "🧪 Test thử chaincode:"
echo "   export PATH=\${PWD}/../bin:\$PATH"
echo "   export FABRIC_CFG_PATH=\$PWD/../config/"
echo "   export CORE_PEER_TLS_ENABLED=true"
echo "   export CORE_PEER_LOCALMSPID=Org1MSP"
echo "   export CORE_PEER_TLS_ROOTCERT_FILE=\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
echo "   export CORE_PEER_MSPCONFIGPATH=\${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
echo "   export CORE_PEER_ADDRESS=localhost:7051"
echo "   peer chaincode query -C mychannel -n vanbang -c '{\"function\":\"ReadDiploma\",\"Args\":[\"TEST001\"]}'"
