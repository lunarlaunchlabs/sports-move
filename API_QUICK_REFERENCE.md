# API Quick Reference

Quick reference for all sports betting API endpoints.

## 🚀 Endpoints

### Market Operations

| Endpoint | Method | Purpose | Blockchain Write |
|----------|--------|---------|------------------|
| `/api/markets` | GET | Fetch & sync markets to blockchain | ✅ Yes |
| `/api/get-markets` | GET | Fetch markets from blockchain | ❌ No (view) |
| `/api/scores` | GET | Resolve markets & settle bets | ✅ Yes |

### User Operations

| Endpoint | Method | Purpose | Blockchain Write |
|----------|--------|---------|------------------|
| `/api/get-user-bets` | GET | Fetch user's bets | ❌ No (view) |

---

## 📋 Quick Examples

### Get Active Markets
```bash
curl "http://localhost:3000/api/get-markets?filter=active"
```

### Get User's Active Bets
```bash
curl "http://localhost:3000/api/get-user-bets?address=0x2f40b38f...&filter=active"
```

### Sync Markets to Blockchain
```bash
curl "http://localhost:3000/api/markets"
```

### Resolve Games
```bash
curl "http://localhost:3000/api/scores"
```

---

## 🔍 Filter Options

### For `/api/get-markets`
- `all` - All markets
- `active` - Not resolved, not cancelled
- `resolved` - Game finished, winner determined
- `cancelled` - Market cancelled, bets refunded

### For `/api/get-user-bets`
- `all` - All bets for user
- `active` - Bets on active markets
- `resolved` - Bets on resolved markets
- `cancelled` - Bets on cancelled markets

---

## 💰 Amount Formatting

All blockchain amounts use 8 decimals:
```javascript
// Convert from blockchain format
const smUSD = parseFloat(amount) / 100_000_000;

// Convert to blockchain format
const blockchainAmount = smUSD * 100_000_000;
```

**Examples:**
- `"10000000000"` = 100 smUSD
- `"5000000000"` = 50 smUSD
- `"100000000"` = 1 smUSD

---

## 📊 Response Structures

### Market Response
```typescript
{
  markets: Market[],
  filter?: string,
  count: number,
  total?: number
}
```

### Bet Response
```typescript
{
  address: string,
  bets: Bet[],
  filter: string,
  count: number,
  total: number
}
```

### Sync Response
```typescript
{
  markets: Market[],
  blockchain: {
    total: number,
    created: number,
    updated: number,
    failed: number,
    errors: string[]
  }
}
```

---

## 🎯 Common Use Cases

### Display Betting Interface
```typescript
// 1. Get active markets
const markets = await fetch('/api/get-markets?filter=active')
  .then(r => r.json());

// 2. Show user's active bets
const bets = await fetch(`/api/get-user-bets?address=${addr}&filter=active`)
  .then(r => r.json());
```

### Show Results Page
```typescript
// Get resolved markets
const results = await fetch('/api/get-markets?filter=resolved')
  .then(r => r.json());
```

### User Bet History
```typescript
// All bets
const allBets = await fetch(`/api/get-user-bets?address=${addr}`)
  .then(r => r.json());

// Won/lost bets
const settledBets = await fetch(`/api/get-user-bets?address=${addr}&filter=resolved`)
  .then(r => r.json());
```

---

## ⚙️ Cron Jobs

```bash
# Update markets every 15 minutes
*/15 * * * * curl -s "https://api.example.com/api/markets"

# Resolve games every 5 minutes  
*/5 * * * * curl -s "https://api.example.com/api/scores"
```

---

## 🔐 Required Environment Variables

```bash
NODE_URL=https://testnet.movementnetwork.xyz/v1
CONTRACT_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5
ADMIN1_PRIVATE_KEY=0x...
ADMIN1_ADDRESS=0x...
```

---

## 📖 Full Documentation

- `/app/api/README.md` - Complete API documentation
- `/app/api/get-markets/README.md` - Market endpoint details
- `/app/api/get-user-bets/README.md` - User bets endpoint details
- `API_IMPLEMENTATION_SUMMARY.md` - Implementation overview

---

**Last Updated:** November 24, 2025

