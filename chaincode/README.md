# Chaincode cho Khóa Luận

## Cấu trúc thư mục

```
chaincode/
├── README.md              # File này
├── my-chaincode/          # Chaincode project của bạn
│   ├── package.json
│   ├── index.js
│   ├── lib/
│   │   └── myContract.js
│   ├── Dockerfile
│   └── .dockerignore
└── test/                  # Tests (optional)
```

## Cách tạo chaincode mới

### Bước 1: Tạo project structure

```bash
cd /home/hoang/khoa-luan/chaincode
mkdir -p my-chaincode/lib
cd my-chaincode
```

### Bước 2: Tạo package.json

```bash
npm init -y
npm install fabric-contract-api fabric-shim --save
```

### Bước 3: Tạo các files

- index.js (entry point)
- lib/myContract.js (smart contract logic)
- Dockerfile
- .dockerignore

### Bước 4: Deploy chaincode

```bash
cd /home/hoang/khoa-luan/network/fabric-samples/test-network

# Deploy chaincode từ thư mục của bạn
./network.sh deployCCAAS -ccn mycc -ccp /home/hoang/khoa-luan/chaincode/my-chaincode
```

## ✅ Được! Bạn có thể lưu chaincode ở đây

Network sẽ tìm chaincode theo đường dẫn tuyệt đối hoặc tương đối:
- Tuyệt đối: `/home/hoang/khoa-luan/chaincode/my-chaincode`
- Tương đối: `../../../chaincode/my-chaincode` (từ test-network)

## Template mẫu

Xem template mẫu tại:
- `/home/hoang/khoa-luan/network/fabric-samples/asset-transfer-basic/chaincode-javascript`

Copy template:
```bash
cp -r /home/hoang/khoa-luan/network/fabric-samples/asset-transfer-basic/chaincode-javascript /home/hoang/khoa-luan/chaincode/my-template
```

## Tài liệu

Xem hướng dẫn chi tiết tại:
- `/home/hoang/khoa-luan/docs/javascript_chaincode_guide.md`
