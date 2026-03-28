# QuantumGuard Backend — Setup Guide

## Folder Structure
```
quantumguard-backend/
├── server.js              ← Main server entry point
├── package.json           ← All dependencies
├── hardhat.config.js      ← Blockchain config
├── .env.example           ← Copy this to .env and fill in values
├── api-connect.js         ← ADD THIS to your dashboard's js/ folder
├── models/
│   └── Farmer.js          ← MongoDB schema
├── routes/
│   ├── auth.js            ← Register + Login
│   ├── farmer.js          ← Profile + Loan eligibility
│   ├── documents.js       ← IPFS upload via Pinata
│   ├── blockchain.js      ← Ethereum Sepolia
│   └── contact.js         ← Contact form
├── middleware/
│   └── auth.js            ← JWT token checker
├── contracts/
│   └── FarmerIdentity.sol ← Solidity smart contract
└── scripts/
    └── deploy.js          ← Deploy contract to Sepolia
```

---

## Step 1 — Install Everything

```bash
cd quantumguard-backend
npm install
```

---

## Step 2 — Create Your .env File

```bash
# Copy the example file
cp .env.example .env
```

Then open `.env` and fill in:
- `MONGO_URI` — your MongoDB Atlas connection string (you already have this!)
- `PINATA_API_KEY` + `PINATA_SECRET_KEY` — from pinata.cloud
- `ALCHEMY_RPC` — from alchemy.com (Sepolia network)
- `PRIVATE_KEY` — your MetaMask wallet private key
- `CONTRACT_ADDRESS` — filled in after Step 4

---

## Step 3 — Start the Server (before deploying contract)

```bash
node server.js
```

You should see:
```
✅ MongoDB connected successfully
🚀 QuantumGuard server running at http://localhost:5000
```

---

## Step 4 — Deploy Smart Contract

```bash
npm run compile
npm run deploy
```

Copy the printed contract address into your `.env`:
```
CONTRACT_ADDRESS=0xYourAddressHere
```

Restart the server: `node server.js`

---

## Step 5 — Connect Your Dashboard

1. Copy `api-connect.js` into your `QuantumGuard-Dashboard/js/` folder
2. Open `QuantumGuard-Dashboard/index.html`
3. Add this line **before** the existing `<script src="js/app.js">` line:

```html
<script src="js/api-connect.js"></script>
```

4. Open `http://localhost:5000` in your browser

---

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | /api/auth/register | Register new farmer |
| POST | /api/auth/login | Login with phone + PIN |
| GET  | /api/auth/me | Get current farmer data |
| GET  | /api/farmer/profile | Get profile |
| PUT  | /api/farmer/profile | Update profile |
| GET  | /api/farmer/loan-eligibility | Check loan eligibility |
| POST | /api/documents/upload | Upload doc to IPFS |
| DELETE | /api/documents/:slotKey | Remove document |
| POST | /api/blockchain/register | Write hash to Ethereum |
| GET  | /api/blockchain/details | Get blockchain info |
| GET  | /api/blockchain/verify/:hash | Verify hash on chain |
| POST | /api/contact | Submit contact form |

---

## Offline / Demo Mode

All API overrides in `api-connect.js` have a fallback to localStorage.
If the server is not running, the dashboard continues to work in demo mode.
