#!/bin/bash

# Script để KHỞI ĐỘNG LẠI Fabric network sau khi tắt máy
# Không xóa data, không deploy lại — chỉ restart containers
# Chạy: cd /home/hoang/khoa-luan/chaincode && bash RESUME.sh

set -e

CC_NAME="vanbang"
NETWORK_DIR="/home/hoang/khoa-luan/network/fabric-samples/test-network"

echo "🔍 Kiểm tra Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker chưa chạy. Hãy khởi động Docker trước."
    exit 1
fi

echo ""
echo "🔄 Khởi động lại tất cả containers của Fabric network..."

# Restart tất cả containers liên quan (peer, orderer, CA, chaincode)
CONTAINERS=$(docker ps -aq --filter "network=fabric_test")
if [ -z "$CONTAINERS" ]; then
    echo "⚠️  Không tìm thấy containers nào. Có thể bạn chưa chạy DEPLOY.sh lần đầu."
    echo "   Hãy chạy: bash DEPLOY.sh"
    exit 1
fi

docker start $CONTAINERS

echo ""
echo "⏳ Chờ 5 giây để containers khởi động hoàn tất..."
sleep 5

echo ""
echo "📋 Trạng thái containers:"
docker ps --filter "network=fabric_test" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
# Kiểm tra chaincode container
CC_RUNNING=$(docker ps --filter "name=ccaas" --filter "status=running" -q)
if [ -n "$CC_RUNNING" ]; then
    echo "✅ Chaincode '$CC_NAME' đang chạy!"
else
    echo "⚠️  Chaincode containers chưa chạy. Thử khởi động riêng..."
    docker start $(docker ps -aq --filter "name=ccaas") 2>/dev/null || true
    sleep 3
    CC_RUNNING=$(docker ps --filter "name=ccaas" --filter "status=running" -q)
    if [ -n "$CC_RUNNING" ]; then
        echo "✅ Chaincode '$CC_NAME' đã khởi động!"
    else
        echo "❌ Không thể khởi động chaincode. Hãy chạy lại: bash DEPLOY.sh"
        exit 1
    fi
fi

echo ""
echo "✅ HOÀN TẤT! Network đã được khởi động lại (dữ liệu blockchain được giữ nguyên)."
echo ""
echo "🌐 Tiếp theo, khởi động backend:"
echo "   cd /home/hoang/khoa-luan/backend && npm run dev"
