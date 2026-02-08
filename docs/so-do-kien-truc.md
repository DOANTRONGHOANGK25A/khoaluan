# Sơ Đồ Kiến Trúc Hệ Thống Xác Thực Văn Bằng
## Blockchain-Based Diploma Verification System

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER (Presentation)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                     FRONTEND (React + Vite)                            │    │
│  │                      Port: 5173 (dev)                                  │    │
│  ├────────────────────────────────────────────────────────────────────────┤    │
│  │  • User Interface (Admin/Verifier)                                     │    │
│  │  • Certificate Upload & Management                                     │    │
│  │  • Verification Portal                                                 │    │
│  │  • Document Display (Portrait, Diploma, Transcript)                    │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                     │                                            │
│                                     │ HTTP/REST API                              │
│                                     ▼                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER (Business Logic)                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                    BACKEND API (Node.js + Express)                     │    │
│  │                         Port: 3000                                     │    │
│  ├────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                         │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │   Routes    │  │ Middlewares  │  │  Services   │  │   Utils    │  │    │
│  │  ├─────────────┤  ├──────────────┤  ├─────────────┤  ├────────────┤  │    │
│  │  │ • Auth      │  │ • CORS       │  │ • Fabric    │  │ • Hash     │  │    │
│  │  │ • Diploma   │  │ • Multer     │  │ • Database  │  │ • Crypto   │  │    │
│  │  │ • Verify    │  │ • Validator  │  │ • File Mgmt │  │ • Logger   │  │    │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  └────────────┘  │    │
│  │                                                                         │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │    │
│  │  │            RecordHash Computation Engine                         │ │    │
│  │  ├──────────────────────────────────────────────────────────────────┤ │    │
│  │  │  SHA256(canonicalCore || 0x1E || portrait ||                     │ │    │
│  │  │         0x1F || diploma || 0x1F || transcript)                   │ │    │
│  │  └──────────────────────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                      │                              │                            │
│                      │ SQL                          │ Fabric SDK                 │
│                      ▼                              ▼                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐  ┌─────────────────────────────────────────────┐
│      DATA LAYER              │  │         BLOCKCHAIN LAYER                    │
├──────────────────────────────┤  ├─────────────────────────────────────────────┤
│                              │  │                                             │
│  ┌────────────────────────┐  │  │  ┌───────────────────────────────────────┐ │
│  │   PostgreSQL Database  │  │  │  │   HYPERLEDGER FABRIC NETWORK          │ │
│  │     Port: 5432         │  │  │  │                                       │ │
│  ├────────────────────────┤  │  │  ├───────────────────────────────────────┤ │
│  │                        │  │  │  │                                       │ │
│  │ Tables:                │  │  │  │  ┌─────────────────────────────────┐ │ │
│  │ • users               │  │  │  │  │         CHAINCODE               │ │ │
│  │ • diplomas            │  │  │  │  │  (Smart Contract - JavaScript)  │ │ │
│  │ • verifications       │  │  │  │  ├─────────────────────────────────┤ │ │
│  │ • files (portraits,   │  │  │  │  │ Functions:                      │ │ │
│  │   diplomas,           │  │  │  │  │ • createRecord()                │ │ │
│  │   transcripts)        │  │  │  │  │ • queryRecord()                 │ │ │
│  │                        │  │  │  │  │ • updateStatus()                │ │ │
│  │ Core Fields:           │  │  │  │  │ • revokeRecord()                │ │ │
│  │ • serialNo            │  │  │  │  │ • verifyHash()                  │ │ │
│  │ • studentId           │  │  │  │  └─────────────────────────────────┘ │ │
│  │ • studentName         │  │  │  │               │                        │ │
│  │ • birthDate           │  │  │  │               │                        │ │
│  │ • major               │  │  │  │  ┌────────────▼─────────────────────┐ │ │
│  │ • ranking             │  │  │  │  │    PEERS (Endorsing Nodes)      │ │ │
│  │ • gpa                 │  │  │  │  ├─────────────────────────────────┤ │ │
│  │ • graduationYear      │  │  │  │  │ • Org1 Peer (Port: 7051)        │ │ │
│  │ • recordHash ✓        │  │  │  │  │ • Org2 Peer (Port: 9051)        │ │ │
│  │ • status              │  │  │  │  │                                 │ │ │
│  │ • issuedAt            │  │  │  │  │ State DB: CouchDB/LevelDB       │ │ │
│  │ • revokedAt           │  │  │  │  └─────────────────────────────────┘ │ │
│  └────────────────────────┘  │  │               │                        │ │
│                              │  │               ▼                        │ │
└──────────────────────────────┘  │  ┌─────────────────────────────────┐ │ │
                                  │  │    ORDERER (Consensus)          │ │ │
                                  │  ├─────────────────────────────────┤ │ │
                                  │  │ • Ordering Service (Raft)       │ │ │
                                  │  │ • Port: 7050                    │ │ │
                                  │  │ • Transaction Ordering          │ │ │
                                  │  └─────────────────────────────────┘ │ │
                                  │               │                        │ │
                                  │               ▼                        │ │
                                  │  ┌─────────────────────────────────┐ │ │
                                  │  │      DISTRIBUTED LEDGER         │ │ │
                                  │  ├─────────────────────────────────┤ │ │
                                  │  │ • Immutable Record Storage      │ │ │
                                  │  │ • Block Chain                   │ │ │
                                  │  │ • Transaction History           │ │ │
                                  │  │ • World State (Key-Value Store) │ │ │
                                  │  └─────────────────────────────────┘ │ │
                                  │                                       │ │
                                  └───────────────────────────────────────┘ │
                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              WORKFLOW OVERVIEW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. ISSUANCE FLOW:                                                              │
│     ┌──────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│     │ User │───▶│ Upload  │───▶│ Compute  │───▶│ Store DB │───▶│ Invoke   │   │
│     │ Input│    │ Files   │    │ RecordHash│   │ (Pending)│    │Chaincode │   │
│     └──────┘    └─────────┘    └──────────┘    └──────────┘    └──────────┘   │
│                                                                       │          │
│                                                                       ▼          │
│                                                          ┌────────────────────┐ │
│                                                          │ Blockchain Record  │ │
│                                                          │ Status: ISSUED     │ │
│                                                          └────────────────────┘ │
│                                                                                  │
│  2. VERIFICATION FLOW:                                                          │
│     ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌─────────────┐          │
│     │ Verifier │───▶│ Query by  │───▶│ Compute  │───▶│   Compare   │          │
│     │  Input   │    │ SerialNo  │    │ NewHash  │    │ with Ledger │          │
│     └──────────┘    └───────────┘    └──────────┘    └─────────────┘          │
│                                                               │                 │
│                                                               ▼                 │
│                                                    ┌──────────────────┐         │
│                                                    │ Valid / Invalid  │         │
│                                                    └──────────────────┘         │
│                                                                                  │
│  3. REVOCATION FLOW:                                                            │
│     ┌────────┐    ┌────────────┐    ┌────────────┐    ┌──────────────┐        │
│     │ Admin  │───▶│  Identify  │───▶│  Update    │───▶│  Blockchain  │        │
│     │ Action │    │  Record    │    │  Status    │    │  Update      │        │
│     └────────┘    └────────────┘    └────────────┘    └──────────────┘        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KEY SECURITY FEATURES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ✓ Immutable Record Storage (Blockchain)                                        │
│  ✓ Cryptographic Hash Verification (SHA-256)                                    │
│  ✓ Multi-Party Consensus (Endorsement Policy)                                   │
│  ✓ Audit Trail (Transaction History)                                            │
│  ✓ Tamper Detection (RecordHash Mismatch)                                       │
│  ✓ Access Control (User Authentication)                                         │
│  ✓ File Integrity (Canonical Hashing)                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Frontend:     React + Vite + React Router                                      │
│  Backend:      Node.js + Express + Fabric SDK                                   │
│  Database:     PostgreSQL                                                       │
│  Blockchain:   Hyperledger Fabric 2.x                                           │
│  Chaincode:    JavaScript (fabric-contract-api)                                 │
│  Storage:      File System (Multer) + PostgreSQL                                │
│  Security:     bcrypt, CORS, JWT (optional)                                     │
│  Hash:         SHA-256 (crypto module)                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## RecordHash Computation Details

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RECORDHASH COMPUTATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT DATA:                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Core Fields (8):          Files (3):                                 │  │
│  │ 1. serialNo                1. portraitBytes    (image)               │  │
│  │ 2. studentId               2. diplomaBytes     (PDF/image)           │  │
│  │ 3. studentName             3. transcriptBytes  (PDF/image)           │  │
│  │ 4. birthDate (YYYY-MM-DD)                                            │  │
│  │ 5. major                                                             │  │
│  │ 6. ranking (XUAT_SAC|GIOI|KHA|TRUNG_BINH)                           │  │
│  │ 7. gpa (X.XX)                                                        │  │
│  │ 8. graduationYear                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              CANONICALIZATION (Normalization)                        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  • UTF-8 encoding                                                    │  │
│  │  • Trim whitespaces                                                  │  │
│  │  • Normalize spaces (multiple → single)                              │  │
│  │  • Date format: YYYY-MM-DD                                           │  │
│  │  • GPA format: X.XX (2 decimals)                                     │  │
│  │  • Ranking: standardized enum values                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   CANONICAL CORE STRING                              │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  serialNo={value}\n                                                  │  │
│  │  studentId={value}\n                                                 │  │
│  │  studentName={value}\n                                               │  │
│  │  birthDate={value}\n                                                 │  │
│  │  major={value}\n                                                     │  │
│  │  ranking={value}\n                                                   │  │
│  │  gpa={value}\n                                                       │  │
│  │  graduationYear={value}\n                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   SHA-256 HASHING                                    │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  SHA256(                                                             │  │
│  │    UTF8(canonicalCore)                                               │  │
│  │    || 0x1E                    ← separator byte                       │  │
│  │    || portraitBytes                                                  │  │
│  │    || 0x1F                    ← separator byte                       │  │
│  │    || diplomaBytes                                                   │  │
│  │    || 0x1F                    ← separator byte                       │  │
│  │    || transcriptBytes                                                │  │
│  │  )                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   RECORDHASH OUTPUT                                  │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  64-character hexadecimal string (lowercase)                         │  │
│  │  Example: a3f5e9c2d1b8...4f7e2a1b                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

Properties:
  • Deterministic: Same input → Same hash
  • Collision-resistant: Different inputs → Different hashes (extremely high probability)
  • One-way: Cannot reverse hash to get original data
  • Tamper-evident: Any change in data produces different hash
```

## Network Topology

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   HYPERLEDGER FABRIC NETWORK TOPOLOGY                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          ┌──────────────────┐                                │
│                          │  Ordering Service│                                │
│                          │   (Raft/Solo)    │                                │
│                          │   Port: 7050     │                                │
│                          └────────┬─────────┘                                │
│                                   │                                           │
│                    ┌──────────────┼──────────────┐                           │
│                    │              │              │                           │
│           ┌────────▼────────┐     │    ┌────────▼────────┐                  │
│           │   ORGANIZATION 1│     │    │  ORGANIZATION 2 │                  │
│           ├─────────────────┤     │    ├─────────────────┤                  │
│           │                 │     │    │                 │                  │
│           │  ┌───────────┐  │     │    │  ┌───────────┐  │                  │
│           │  │  Peer0    │  │     │    │  │  Peer0    │  │                  │
│           │  │ Port:7051 │  │     │    │  │ Port:9051 │  │                  │
│           │  │           │  │     │    │  │           │  │                  │
│           │  │ CouchDB/  │  │     │    │  │ CouchDB/  │  │                  │
│           │  │ LevelDB   │  │     │    │  │ LevelDB   │  │                  │
│           │  └───────────┘  │     │    │  └───────────┘  │                  │
│           │                 │     │    │                 │                  │
│           │  ┌───────────┐  │     │    │  ┌───────────┐  │                  │
│           │  │    CA     │  │     │    │  │    CA     │  │                  │
│           │  │ Port:7054 │  │     │    │  │ Port:8054 │  │                  │
│           │  └───────────┘  │     │    │  └───────────┘  │                  │
│           │                 │     │    │                 │                  │
│           │  MSP: Org1MSP   │     │    │  MSP: Org2MSP   │                  │
│           └─────────────────┘     │    └─────────────────┘                  │
│                                   │                                           │
│                          ┌────────▼─────────┐                                │
│                          │     CHANNEL      │                                │
│                          │  (mychannel)     │                                │
│                          │                  │                                │
│                          │  ┌────────────┐  │                                │
│                          │  │ CHAINCODE  │  │                                │
│                          │  │(Deployed)  │  │                                │
│                          │  └────────────┘  │                                │
│                          └──────────────────┘                                │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---
**Generated:** February 2026  
**Version:** 1.0  
**Project:** Blockchain-Based Diploma Verification System  
**Technology:** Hyperledger Fabric + Node.js + React + PostgreSQL
