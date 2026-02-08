# 🚀 HƯỚNG DẪN VIẾT CHAINCODE JAVASCRIPT CHO HYPERLEDGER FABRIC

## ✅ Kết quả đã đạt được

- ✓ Network Fabric đã chạy (3 containers: 2 peers + 1 orderer)
- ✓ Channel "mychannel" đã tạo (LevelDB)
- ✓ Chaincode JavaScript đã được package & install
- ✓ Docker image chaincode đã build thành công

## 📂 Cấu trúc Chaincode JavaScript

```
chaincode-javascript/
├── package.json          # Dependencies & scripts
├── index.js              # Entry point
├── lib/
│   └── assetTransfer.js  # Smart contract logic
├── Dockerfile            # Container image (đã tạo)
└── .dockerignore         # Ignore files (đã tạo)
```

## 📝 Ví dụ Chaincode đơn giản

### 1. package.json
```json
{
  "name": "my-chaincode",
  "version": "1.0.0",
  "description": "My first JavaScript chaincode",
  "main": "index.js",
  "scripts": {
    "start": "fabric-chaincode-node start"
  },
  "dependencies": {
    "fabric-contract-api": "~2.5",
    "fabric-shim": "~2.5"
  }
}
```

### 2. index.js
```javascript
'use strict';

const MyContract = require('./lib/myContract');

module.exports.contracts = [MyContract];
```

### 3. lib/myContract.js
```javascript
'use strict';

const { Contract } = require('fabric-contract-api');

class MyContract extends Contract {

    // Khởi tạo ledger
    async InitLedger(ctx) {
        const data = [
            { id: 'item1', value: 'Hello', owner: 'Alice' },
            { id: 'item2', value: 'World', owner: 'Bob' },
        ];

        for (const item of data) {
            await ctx.stub.putState(item.id, Buffer.from(JSON.stringify(item)));
            console.log(`Added item: ${item.id}`);
        }
        return JSON.stringify(data);
    }

    // Tạo mới item
    async CreateItem(ctx, id, value, owner) {
        const exists = await this.ItemExists(ctx, id);
        if (exists) {
            throw new Error(`Item ${id} already exists`);
        }

        const item = {
            id: id,
            value: value,
            owner: owner,
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(item)));
        return JSON.stringify(item);
    }

    // Đọc item
    async ReadItem(ctx, id) {
        const itemJSON = await ctx.stub.getState(id);
        if (!itemJSON || itemJSON.length === 0) {
            throw new Error(`Item ${id} does not exist`);
        }
        return itemJSON.toString();
    }

    // Update item
    async UpdateItem(ctx, id, newValue) {
        const exists = await this.ItemExists(ctx, id);
        if (!exists) {
            throw new Error(`Item ${id} does not exist`);
        }

        const itemString = await this.ReadItem(ctx, id);
        const item = JSON.parse(itemString);
        item.value = newValue;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(item)));
        return JSON.stringify(item);
    }

    // Delete item
    async DeleteItem(ctx, id) {
        const exists = await this.ItemExists(ctx, id);
        if (!exists) {
            throw new Error(`Item ${id} does not exist`);
        }
        await ctx.stub.deleteState(id);
    }

    // Kiểm tra item có tồn tại không
    async ItemExists(ctx, id) {
        const itemJSON = await ctx.stub.getState(id);
        return itemJSON && itemJSON.length > 0;
    }

    // Lấy tất cả items
    async GetAllItems(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();

        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }

    // Transfer ownership
    async TransferItem(ctx, id, newOwner) {
        const itemString = await this.ReadItem(ctx, id);
        const item = JSON.parse(itemString);
        const oldOwner = item.owner;
        item.owner = newOwner;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(item)));
        return `Item ${id} transferred from ${oldOwner} to ${newOwner}`;
    }
}

module.exports = MyContract;
```

## 🐳 Dockerfile cho Chaincode

```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
COPY npm-shrinkwrap.json* ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose port
ENV PORT=9999
EXPOSE 9999

# Start chaincode
CMD ["npm", "start"]
```

## 🔧 Commands để Deploy

```bash
# 1. Khởi động network
./network.sh up createChannel -c mychannel

# 2. Deploy chaincode JavaScript (as a service)
./network.sh deployCCAAS -ccn mycc -ccp ../path/to/chaincode-javascript

# 3. Test chaincode
# Init ledger
peer chaincode invoke -C mychannel -n mycc -c '{"function":"InitLedger","Args":[]}'

# Create item
peer chaincode invoke -C mychannel -n mycc -c '{"function":"CreateItem","Args":["item3","Test","Charlie"]}'

# Read item
peer chaincode query -C mychannel -n mycc -c '{"function":"ReadItem","Args":["item1"]}'

# Get all items
peer chaincode query -C mychannel -n mycc -c '{"function":"GetAllItems","Args":[]}'

# Update item
peer chaincode invoke -C mychannel -n mycc -c '{"function":"UpdateItem","Args":["item1","NewValue"]}'

# Transfer item
peer chaincode invoke -C mychannel -n mycc -c '{"function":"TransferItem","Args":["item1","Dave"]}'

# Delete item
peer chaincode invoke -C mychannel -n mycc -c '{"function":"DeleteItem","Args":["item1"]}'
```

## 📚 Fabric Contract API - Các phương thức quan trọng

### ctx.stub - Chaincode Stub Interface

```javascript
// Write operations
await ctx.stub.putState(key, value)           // Lưu data
await ctx.stub.deleteState(key)               // Xóa data

// Read operations
await ctx.stub.getState(key)                  // Đọc 1 key
await ctx.stub.getStateByRange(start, end)    // Đọc range
await ctx.stub.getQueryResult(query)          // Rich query (CouchDB only)

// Transaction info
ctx.stub.getTxID()                            // Get transaction ID
ctx.stub.getTxTimestamp()                     // Get timestamp
ctx.stub.getChannelID()                       // Get channel name

// Caller identity
ctx.clientIdentity.getID()                    // Get client ID
ctx.clientIdentity.getMSPID()                 // Get MSP ID
ctx.clientIdentity.getAttributeValue(attr)    // Get attribute
```

## 🎯 Best Practices

1. **Validate input data:**
   ```javascript
   if (!id || !value) {
       throw new Error('Missing required parameters');
   }
   ```

2. **Use deterministic JSON:**
   ```javascript
   const stringify = require('json-stringify-deterministic');
   const sortKeysRecursive = require('sort-keys-recursive');
   
   await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
   ```

3. **Handle errors properly:**
   ```javascript
   try {
       // your code
   } catch (error) {
       throw new Error(`Failed to create item: ${error.message}`);
   }
   ```

4. **Add logging:**
   ```javascript
   console.log(`Creating item with ID: ${id}`);
   ```

5. **Use transactions for multiple operations:**
   ```javascript
   async TransferMoney(ctx, from, to, amount) {
       // Read both accounts
       const fromAccount = await this.ReadAccount(ctx, from);
       const toAccount = await this.ReadAccount(ctx, to);
       
       // Update balances
       fromAccount.balance -= amount;
       toAccount.balance += amount;
       
       // Save both (atomic transaction)
       await ctx.stub.putState(from, Buffer.from(JSON.stringify(fromAccount)));
       await ctx.stub.putState(to, Buffer.from(JSON.stringify(toAccount)));
   }
   ```

## 🔍 Debugging

```javascript
// Add console.log for debugging
async MyFunction(ctx, param) {
    console.log('=== MyFunction called ===');
    console.log('Parameter:', param);
    
    // Your code
    const result = await someOperation();
    
    console.log('Result:', JSON.stringify(result));
    return result;
}
```

View logs:
```bash
docker logs peer0.org1.example.com
```

## 📖 Tài liệu tham khảo

- Fabric Contract API: https://hyperledger.github.io/fabric-chaincode-node/
- Fabric Shim: https://hyperledger.github.io/fabric-shim/
- Samples: /home/hoang/khoa-luan/network/fabric-samples/asset-transfer-basic/chaincode-javascript

## 🎓 Bài tập thực hành

1. Tạo chaincode quản lý sinh viên (ID, tên, điểm)
2. Thêm chức năng tìm kiếm theo tên
3. Thêm chức năng cập nhật điểm
4. Thêm validation (điểm từ 0-10)
5. Thêm function tính điểm trung bình

Good luck! 🚀
