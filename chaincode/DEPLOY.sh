#!/bin/bash

# Script để deploy chaincode từ /home/hoang/khoa-luan/chaincode/example-chaincode

cd /home/hoang/khoa-luan/network/fabric-samples/test-network

echo "🔧 Bước 1: Dọn dẹp network cũ..."
./network.sh down

echo ""
echo "🚀 Bước 2: Khởi động network..."
./network.sh up createChannel -ca

echo ""
echo "📦 Bước 3: Deploy chaincode..."
./network.sh deployCCAAS -ccn example -ccp /home/hoang/khoa-luan/chaincode/example-chaincode

echo ""
echo "✅ HOÀN TẤT! Chaincode đã được deploy thành công!"
echo ""
echo "📝 Để test chaincode, chạy lệnh sau:"
echo "   cd /home/hoang/khoa-luan/network/fabric-samples/test-network"
echo "   source ./scripts/envVar.sh"
echo "   setGlobals 1"
echo "   peer chaincode query -C mychannel -n example -c '{\"function\":\"GetAllItems\",\"Args\":[]}'"
