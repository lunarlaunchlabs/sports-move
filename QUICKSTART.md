# 🚀 Quick Start - Movement Network Integration

## What You Got

✅ **Smart Contract** - Deployed on Movement Testnet  
✅ **Backend Service** - Read/write contract data  
✅ **API Endpoints** - GET and POST routes  
✅ **Test Suite** - Automated integration tests  

## Test It Now (3 Steps)

### 1. Start the Server
```bash
npm run dev
```

### 2. Run the Test Script
Open a new terminal:
```bash
node test-contract-api.js
```

### 3. Expected Output
```
🧪 Movement Network Contract API Test Suite
==================================================

=== Testing POST /api/mock-move-contract ===
✅ POST request successful!
Transaction Hash: 0xabc123...
Address: 0x99b815...

⏳ Waiting 3 seconds for transaction to be confirmed...

=== Testing GET /api/mock-move-contract ===
✅ GET request successful!
Data:
  Message: Test message at 2025-11-24T...
  Value: 742
  Is Active: true

🎉 All tests passed!
Your Movement Network integration is working! 🚀
```

## Try the API Manually

### Write Data (POST)
```bash
curl -X POST http://localhost:3000/api/mock-move-contract \
  -H "Content-Type: application/json" \
  -d '{
    "privateKey": "YOUR_PRIVATE_KEY_FROM_.movement/config.yaml",
    "message": "Hello from API!",
    "value": 42
  }'
```

### Read Data (GET)
```bash
curl "http://localhost:3000/api/mock-move-contract?address=YOUR_ADDRESS_FROM_POST_RESPONSE"
```

## Files Created

```
✅ app/services/MockMoveContract.ts       - Contract interaction service
✅ app/api/mock-move-contract/route.ts    - GET/POST API endpoints
✅ app/api/mock-move-contract/README.md   - API documentation
✅ test-contract-api.js                   - Automated test script
✅ MOVEMENT_INTEGRATION.md                - Complete integration guide
```

## Need Help?

📖 **Full Documentation:**
- [API Guide](./app/api/mock-move-contract/README.md)
- [Integration Guide](./MOVEMENT_INTEGRATION.md)
- [Contract Docs](./mock-move/README.md)

🔗 **Resources:**
- [Movement Testnet Explorer](https://explorer.movementnetwork.xyz/?network=bardock+testnet)
- [Get Testnet Tokens](https://faucet.testnet.movementnetwork.xyz/)

## Success Criteria ✅

Your integration is successful if:
- ✅ POST request writes data to blockchain
- ✅ GET request reads the same data back
- ✅ Transaction appears in Movement Explorer
- ✅ All tests pass

**You're all set! Start building! 🎉**

