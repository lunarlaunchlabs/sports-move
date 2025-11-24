# Movement Network Integration Guide

This project integrates with the Movement Network blockchain to store and retrieve data on-chain.

## 📁 Project Structure

```
sports-move/
├── mock-move/                          # Move smart contract project
│   ├── sources/
│   │   └── hello_world.move           # Smart contract module
│   ├── Move.toml                       # Contract configuration
│   ├── README.md                       # Contract documentation
│   └── .movement/                      # CLI config (contains private key - gitignored)
│
├── app/
│   ├── services/
│   │   └── MockMoveContract.ts        # Service for contract interaction
│   └── api/
│       └── mock-move-contract/
│           ├── route.ts                # API endpoints (GET/POST)
│           └── README.md               # API documentation
│
└── test-contract-api.js                # Integration test script
```

## 🎯 What Was Built

### 1. Smart Contract (`mock-move/sources/hello_world.move`)

A Move module deployed on Movement Testnet that stores:
- **Message** (String): Text data
- **Value** (u64): Numeric data
- **IsActive** (bool): Status flag

**Contract Address:** `0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c`

**Key Features:**
- View functions for reading data (frontend)
- Entry functions for writing data (backend)
- Event emission on data changes
- Comprehensive unit tests (5 tests, all passing)

### 2. Backend Service (`app/services/MockMoveContract.ts`)

TypeScript service that provides:
- `getData(address)` - Read all data from contract
- `setData(privateKey, message, value)` - Write data to contract
- `getField(address, field)` - Read specific field
- `hasDataStore(address)` - Check if initialized
- `getContractAddress()` - Get contract address

### 3. API Endpoints (`app/api/mock-move-contract/route.ts`)

RESTful API for contract interaction:

#### GET `/api/mock-move-contract`
Read data from the blockchain.

**Query Parameters:**
- `address` (required): Account address to read from
- `field` (optional): Specific field (`message`, `value`, `isActive`)

**Example:**
```bash
curl "http://localhost:3000/api/mock-move-contract?address=0x99b8..."
```

#### POST `/api/mock-move-contract`
Write data to the blockchain.

**Request Body:**
```json
{
  "privateKey": "0x...",
  "message": "Hello",
  "value": 42
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/mock-move-contract \
  -H "Content-Type: application/json" \
  -d '{"privateKey":"0x...","message":"Hello","value":42}'
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Integration Tests
```bash
node test-contract-api.js
```

This will:
1. ✅ Write data to the Movement smart contract (POST)
2. ✅ Read all data from the contract (GET)
3. ✅ Read specific fields (GET with field parameter)

## 📊 Architecture Flow

```
Frontend/Client
      ↓
   API Routes (/api/mock-move-contract)
      ↓
 MockMoveContract Service
      ↓
   Aptos SDK Client
      ↓
Movement Testnet (https://testnet.movementnetwork.xyz/v1)
      ↓
  Smart Contract (hello_world module)
```

## 🔐 Security

**⚠️ Important Security Notes:**

1. **Private Keys:**
   - Never commit `.movement/config.yaml` to git (already gitignored)
   - Store private keys in environment variables for production
   - Never expose private keys in client-side code

2. **Environment Variables:**
   Create `.env.local`:
   ```
   MOVEMENT_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   ```

3. **Production Deployment:**
   - Use server-side signing only
   - Implement proper authentication
   - Rate limit API endpoints
   - Validate all inputs

## 🧪 Testing

### Manual Testing with cURL

**1. Write data (POST):**
```bash
curl -X POST http://localhost:3000/api/mock-move-contract \
  -H "Content-Type: application/json" \
  -d '{
    "privateKey": "0xYOUR_PRIVATE_KEY",
    "message": "Test Message",
    "value": 100
  }'
```

**2. Read data (GET):**
```bash
curl "http://localhost:3000/api/mock-move-contract?address=0x99b8..."
```

**3. Read specific field:**
```bash
curl "http://localhost:3000/api/mock-move-contract?address=0x99b8...&field=message"
```

### Automated Testing

Run the provided test script:
```bash
node test-contract-api.js
```

Expected output:
```
🧪 Movement Network Contract API Test Suite
==================================================

=== Testing POST /api/mock-move-contract ===
✅ POST request successful!

=== Testing GET /api/mock-move-contract ===
✅ GET request successful!

🎉 All tests passed!
```

## 📦 Smart Contract Details

### Compile Contract
```bash
cd mock-move
movement move compile
```

### Run Tests
```bash
cd mock-move
movement move test
```

Expected: `Test result: OK. Total tests: 5; passed: 5; failed: 0`

### Deploy Contract (if needed)
```bash
cd mock-move
movement move publish
```

## 🔗 Resources

### Movement Network
- [Documentation](https://docs.movementnetwork.xyz/)
- [Testnet Explorer](https://explorer.movementnetwork.xyz/?network=bardock+testnet)
- [Faucet](https://faucet.testnet.movementnetwork.xyz/)
- [Network Endpoints](https://docs.movementnetwork.xyz/devs/network-endpoints)

### Contract Info
- **Address:** `0x99b815740349fe620dfcc577e7cd0c6106f031e2c8cf1de5579de9a5b25b0a4c`
- **Module:** `hello_world`
- **Network:** Movement Testnet
- **RPC:** `https://testnet.movementnetwork.xyz/v1`

### Documentation Files
- [Contract README](./mock-move/README.md) - Smart contract documentation
- [API README](./app/api/mock-move-contract/README.md) - API usage guide
- [Main README](./README.md) - Project overview

## 🎯 Use Cases

### 1. Store Sports Data On-Chain
```typescript
await fetch('/api/mock-move-contract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    privateKey: process.env.MOVEMENT_PRIVATE_KEY,
    message: JSON.stringify({ game: 'NBA', score: '120-115' }),
    value: 120115
  })
});
```

### 2. Read Sports Data
```typescript
const response = await fetch(`/api/mock-move-contract?address=${address}`);
const { data } = await response.json();
console.log(data.message); // Game data
console.log(data.value);   // Score
```

### 3. Track Game Status
```typescript
// Check if game data is active
const { data } = await fetch(`/api/mock-move-contract?address=${address}&field=isActive`)
  .then(r => r.json());
console.log(data.value); // true/false
```

## 🛠️ Troubleshooting

### "Failed to write contract data"
- Ensure account has testnet tokens from [faucet](https://faucet.testnet.movementnetwork.xyz/)
- Verify private key is correct (check `.movement/config.yaml`)
- Check Movement testnet status

### "Data store not initialized"
- Write data first (POST) before reading (GET)
- Contract auto-initializes on first write

### "Transaction not found"
- Wait 3-5 seconds for blockchain confirmation
- Check explorer URL in response
- Verify testnet is operational

### Test script fails
1. Make sure dev server is running: `npm run dev`
2. Verify account has testnet tokens
3. Check `.movement/config.yaml` exists in `mock-move/` directory

## 🚀 Next Steps

1. **Deploy to Production:**
   - Deploy contract to Movement mainnet
   - Set up environment variables
   - Implement proper authentication

2. **Extend Functionality:**
   - Add more complex data structures
   - Implement access control
   - Add data validation

3. **Integrate with Frontend:**
   - Create React components
   - Add wallet connection
   - Implement real-time updates

4. **Monitor & Maintain:**
   - Track gas costs
   - Monitor transaction success rates
   - Set up error logging

## 📝 License

MIT

