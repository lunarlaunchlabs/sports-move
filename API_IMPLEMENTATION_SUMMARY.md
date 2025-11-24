# API Implementation Summary

Complete implementation of sports betting API layer with blockchain integration.

## ✅ Implemented API Endpoints

### 1. Market Data Endpoints

#### `GET /api/markets`
**Purpose:** Fetch markets from The Odds API and sync to blockchain

**Features:**
- Fetches latest market data (currently from mock)
- **Automatically creates/updates markets on blockchain**
- Extracts FanDuel odds from bookmakers
- Converts American odds to contract format
- Returns sync results

**Response:**
```json
{
  "markets": [ /* market data */ ],
  "blockchain": {
    "total": 10,
    "created": 8,
    "updated": 0,
    "failed": 2,
    "errors": []
  }
}
```

---

#### `GET /api/get-markets`
**Purpose:** Fetch markets from blockchain with filtering

**Query Parameters:**
- `filter`: `all` | `active` | `resolved` | `cancelled`

**Features:**
- Reads directly from blockchain
- Filters by market status
- No gas cost (view function)
- Real-time data

**Response:**
```json
{
  "markets": [ /* on-chain markets */ ],
  "filter": "active",
  "count": 5,
  "total": 10
}
```

---

### 2. Scores & Resolution Endpoints

#### `GET /api/scores`
**Purpose:** Fetch scores and automatically resolve markets

**Features:**
- Fetches game scores (currently from mock)
- **Automatically resolves markets** based on final scores
- **Automatically settles bets** and pays winners
- Handles ties by cancelling markets
- Returns resolution results

**Response:**
```json
{
  "scores": [ /* score data */ ],
  "blockchain": {
    "total": 5,
    "resolved": 5,
    "settled": 5,
    "cancelled": 0,
    "failed": 0,
    "errors": []
  }
}
```

---

### 3. User Bet Endpoints

#### `GET /api/get-user-bets`
**Purpose:** Fetch all bets for a specific user

**Query Parameters:**
- `address` (required): User's wallet address
- `filter`: `all` | `active` | `resolved` | `cancelled`

**Features:**
- Fetches user's bet history
- Filters by market status
- Shows potential payouts
- Displays bet settlement status

**Response:**
```json
{
  "address": "0x...",
  "bets": [ /* user bets */ ],
  "filter": "active",
  "count": 3,
  "total": 10
}
```

---

## 🔧 Backend Services

### `SportsBettingContract` Service

Location: `/app/services/SportsBettingContract.ts`

**Methods:**

| Method | Purpose | Gas Required |
|--------|---------|--------------|
| `createMarket(market)` | Create market on-chain | Yes |
| `updateMarketOdds(market)` | Update odds only | Yes |
| `resolveMarket(score)` | Resolve market with winner | Yes |
| `settleBets(gameId)` | Pay out winning bets | Yes |
| `cancelMarket(gameId)` | Cancel and refund | Yes |
| `getAllMarkets()` | Fetch all markets | No (view) |
| `getMarket(gameId)` | Fetch specific market | No (view) |

**Features:**
- Automatic FanDuel odds extraction
- American odds conversion (positive/negative)
- Error handling and retry logic
- Transaction tracking

---

## 📊 Data Flow

### Market Creation Flow
```
The Odds API (Mock)
        ↓
GET /api/markets
        ↓
Extract FanDuel odds
        ↓
Convert to contract format
        ↓
createMarket() → Blockchain
        ↓
Market Created Event
```

### Bet Resolution Flow
```
Scores API (Mock)
        ↓
GET /api/scores
        ↓
Determine winner
        ↓
resolveMarket() → Blockchain
        ↓
settleBets() → Blockchain
        ↓
Winners Paid (5% house fee)
```

### User Bet Query Flow
```
User Address
        ↓
GET /api/get-user-bets?address=0x...
        ↓
get_user_bets() view function
        ↓
Filter by market status
        ↓
Return formatted bets
```

---

## 🎯 Use Cases

### For Frontend

**Display Active Betting Markets:**
```typescript
const { markets } = await fetch('/api/get-markets?filter=active').then(r => r.json());
// Show markets users can bet on
```

**Show User's Active Bets:**
```typescript
const { bets } = await fetch(`/api/get-user-bets?address=${userAddress}&filter=active`).then(r => r.json());
// Display pending bets
```

**View Bet History:**
```typescript
const { bets } = await fetch(`/api/get-user-bets?address=${userAddress}&filter=resolved`).then(r => r.json());
// Show win/loss history
```

**Check Results:**
```typescript
const { markets } = await fetch('/api/get-markets?filter=resolved').then(r => r.json());
// Display game results and winners
```

---

### For Cron Jobs

**Update Markets (Every 15 minutes):**
```bash
*/15 * * * * curl -s "https://your-domain.com/api/markets"
```

**Resolve Games (Every 5 minutes):**
```bash
*/5 * * * * curl -s "https://your-domain.com/api/scores"
```

---

## 📁 File Structure

```
app/
├── api/
│   ├── markets/
│   │   └── route.ts              # Sync markets to blockchain
│   ├── get-markets/
│   │   ├── route.ts              # Fetch markets from blockchain
│   │   └── README.md             # Endpoint documentation
│   ├── scores/
│   │   └── route.ts              # Resolve markets and settle bets
│   ├── get-user-bets/
│   │   ├── route.ts              # Fetch user bets
│   │   └── README.md             # Endpoint documentation
│   └── README.md                 # Overall API documentation
│
└── services/
    ├── TheOddsApi.ts             # Mock data provider
    └── SportsBettingContract.ts  # Blockchain interaction service
```

---

## 🔐 Environment Variables

Required in `.env`:

```bash
# Network
NODE_URL=https://testnet.movementnetwork.xyz/v1

# Contract
CONTRACT_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5

# Admin (for blockchain writes)
ADMIN1_PRIVATE_KEY=0x56866fce3807b72ef906179b314375ac60a9ccb623894ec9f9613bf52e49c02f
ADMIN1_ADDRESS=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841
```

---

## 📝 Response Formats

### Market Object
```typescript
{
  game_id: string,
  sport_key: string,
  sport_title: string,
  home_team: string,
  away_team: string,
  commence_time: number,
  home_odds: number,
  away_odds: number,
  home_odds_is_negative: boolean,
  away_odds_is_negative: boolean,
  is_resolved: boolean,
  is_cancelled: boolean,
  winning_outcome: string
}
```

### Bet Object
```typescript
{
  bet_id: string,
  user: string,
  game_id: string,
  outcome: string,
  amount: string,              // 8 decimals (e.g., "10000000000" = 100 smUSD)
  odds: string,
  odds_is_negative: boolean,
  potential_payout: string,    // 8 decimals
  is_settled: boolean,
  timestamp: string
}
```

---

## 🧪 Testing

### Test Endpoints Locally

```bash
# Start dev server
npm run dev

# Test markets sync
curl "http://localhost:3000/api/markets" | jq .

# Test get markets with filter
curl "http://localhost:3000/api/get-markets?filter=active" | jq .

# Test scores and resolution
curl "http://localhost:3000/api/scores" | jq .

# Test user bets
curl "http://localhost:3000/api/get-user-bets?address=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841" | jq .

# Test filtered user bets
curl "http://localhost:3000/api/get-user-bets?address=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841&filter=active" | jq .
```

---

## 🚨 Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error description",
  "details": "Detailed error message",
  "/* relevant data */": []
}
```

**Common Errors:**
- Missing required parameters (400)
- Invalid address format (400)
- Blockchain read/write failures (500)
- Network timeouts (500)

---

## 🎯 Next Steps

### Immediate
- ✅ API endpoints implemented
- ✅ Blockchain integration complete
- ✅ Documentation created
- ⏭️ Frontend integration
- ⏭️ User testing

### Future Enhancements
1. Replace mock data with real The Odds API
2. Add pagination for large result sets
3. Implement WebSocket for real-time updates
4. Add bet placement endpoint
5. Create admin dashboard endpoints
6. Add analytics endpoints
7. Implement caching layer for better performance

---

## 📚 Documentation

| File | Description |
|------|-------------|
| `/app/api/README.md` | Overall API documentation |
| `/app/api/get-markets/README.md` | get-markets endpoint details |
| `/app/api/get-user-bets/README.md` | get-user-bets endpoint details |
| `DEPLOYMENT_INFO.md` | Contract deployment details |
| `CONTRACTS_DEPLOYED.md` | Quick reference guide |

---

## ✅ Implementation Checklist

- [x] Market sync endpoint (`/api/markets`)
- [x] Market fetch endpoint (`/api/get-markets`)
- [x] Score resolution endpoint (`/api/scores`)
- [x] User bets endpoint (`/api/get-user-bets`)
- [x] Blockchain service layer
- [x] Error handling
- [x] Response formatting
- [x] Query parameter filtering
- [x] Comprehensive documentation
- [x] TypeScript types
- [x] Linter compliance

---

**Implementation Date:** November 24, 2025  
**Version:** 1.0.0  
**Status:** Production Ready (Testnet)

