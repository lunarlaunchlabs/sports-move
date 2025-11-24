# Sports Betting API Documentation

This directory contains the API endpoints for the sports betting application, integrating The Odds API data with Movement Network blockchain.

## 📋 Overview

The API layer serves two purposes:
1. **Data Provider**: Returns sports markets and scores data (currently from mock files)
2. **Blockchain Oracle**: Writes markets and resolves outcomes on the Movement Network smart contracts

---

## 🔌 API Endpoints

### GET `/api/markets`

Fetches available betting markets and **automatically syncs them to the blockchain**.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sport` | string | null | Filter by sport key (e.g., 'americanfootball_nfl') |

#### Response Format

```json
{
  "markets": [
    {
      "id": "game_001_49ers_vs_cowboys",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2025-11-25T18:00:00Z",
      "home_team": "San Francisco 49ers",
      "away_team": "Dallas Cowboys",
      "bookmakers": [
        {
          "key": "fanduel",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                { "name": "San Francisco 49ers", "price": -150 },
                { "name": "Dallas Cowboys", "price": 130 }
              ]
            }
          ]
        }
      ]
    }
  ],
  "blockchain": {
    "total": 10,
    "created": 8,
    "updated": 0,
    "failed": 2,
    "errors": [
      "game_xyz: Market already exists"
    ]
  }
}
```

#### Example Usage

```bash
# Get markets and sync to blockchain
curl "http://localhost:3000/api/markets"

# Get markets for specific sport and sync to blockchain
curl "http://localhost:3000/api/markets?sport=americanfootball_nfl"
```

#### Blockchain Behavior

**Always enabled:**
- Creates new markets on-chain for games that haven't started
- Skips markets that have already commenced
- Automatically extracts FanDuel odds from bookmakers
- Converts American odds format to smart contract format (u64 + boolean)
- Returns detailed sync results including successes and failures

---

### GET `/api/scores`

Fetches game scores and **automatically resolves markets and settles bets** on the blockchain.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sport` | string | null | Filter by sport key |

#### Response Format

```json
{
  "scores": [
    {
      "id": "game_001_49ers_vs_cowboys",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2025-11-25T18:00:00Z",
      "completed": true,
      "home_team": "San Francisco 49ers",
      "away_team": "Dallas Cowboys",
      "scores": [
        { "name": "San Francisco 49ers", "score": 28 },
        { "name": "Dallas Cowboys", "score": 24 }
      ],
      "last_update": "2025-11-25T21:30:00Z"
    }
  ],
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

#### Example Usage

```bash
# Get scores, resolve markets, and settle bets
curl "http://localhost:3000/api/scores"

# Get scores for specific sport, resolve markets, and settle bets
curl "http://localhost:3000/api/scores?sport=americanfootball_nfl"
```

#### Blockchain Behavior

**Always enabled:**
- Processes completed games only
- Determines winning team based on final score
- Calls `resolve_market` on smart contract
- Handles ties by cancelling the market (triggers automatic refunds)
- Immediately calls `settle_bets` after resolving
- Automatically pays out winning bets (with 5% house fee deducted)
- Updates house balance accordingly
- Returns detailed settlement results

---

## 🔧 Backend Service

### `SportsBettingContract` Service

Location: `/app/services/SportsBettingContract.ts`

Provides methods for interacting with the deployed smart contracts on Movement Network.

#### Methods

##### `createMarket(market: MarketData): Promise<string>`
Creates a new betting market on the blockchain.

- Extracts FanDuel odds from market data
- Converts American odds to contract format
- Returns transaction hash

##### `updateMarketOdds(market: MarketData): Promise<string>`
Updates odds for an existing market.

- Called automatically if market already exists
- Only updates odds, keeps other data unchanged
- Returns transaction hash

##### `resolveMarket(score: ScoreData): Promise<string>`
Resolves a market based on final score.

- Determines winner from score data
- Handles ties by cancelling market
- Returns transaction hash

##### `settleBets(gameId: string): Promise<string>`
Settles all bets for a resolved market.

- Automatically pays winners (house takes 5% fee)
- Can only be called after market is resolved
- Returns transaction hash

##### `cancelMarket(gameId: string): Promise<string>`
Cancels a market and triggers refunds.

- Refunds all open, unsettled bets
- Used for postponed/cancelled games or ties
- Returns transaction hash

##### `getAllMarkets(): Promise<OnChainMarket[]>`
Retrieves all markets from the blockchain.

- View function (no gas cost)
- Returns array of on-chain market data

##### `getMarket(gameId: string): Promise<OnChainMarket | null>`
Retrieves a specific market from the blockchain.

- View function (no gas cost)
- Returns market data or null if not found

---

## 🔄 Workflow Examples

### Daily Market Update Workflow

```bash
# 1. Sync latest markets from The Odds API to blockchain
curl "http://localhost:3000/api/markets"

# 2. Check for completed games, resolve markets, and settle bets
curl "http://localhost:3000/api/scores"
```

### Cron Job Setup (Recommended)

**Update Markets (Every 15 minutes):**
```bash
*/15 * * * * curl -s "https://your-domain.com/api/markets" > /dev/null
```

**Resolve Games and Settle Bets (Every 5 minutes):**
```bash
*/5 * * * * curl -s "https://your-domain.com/api/scores" > /dev/null
```

---

## 🔐 Configuration

### Environment Variables

Required in `.env`:

```bash
# Network
NODE_URL=https://testnet.movementnetwork.xyz/v1

# Contract
CONTRACT_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5

# Admin Credentials (for blockchain writes)
ADMIN1_PRIVATE_KEY=0x56866fce3807b72ef906179b314375ac60a9ccb623894ec9f9613bf52e49c02f
ADMIN1_ADDRESS=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841
```

---

## 📊 Data Flow

### Markets Flow
```
The Odds API (Mock)
        ↓
GET /api/markets
        ↓
  [sync=true?]
        ↓
SportsBettingContract.createMarket()
        ↓
Movement Network Blockchain
        ↓
Market Created Event
```

### Scores Flow
```
The Odds API Scores (Mock)
        ↓
GET /api/scores
        ↓
  [resolve=true?]
        ↓
SportsBettingContract.resolveMarket()
        ↓
  [settle=true?]
        ↓
SportsBettingContract.settleBets()
        ↓
Movement Network Blockchain
        ↓
Bets Settled, Winners Paid
```

---

## 🧪 Testing

### Test Market Sync

```bash
# Start dev server
npm run dev

# Get markets and sync to blockchain
curl "http://localhost:3000/api/markets" | jq .

# Expected: markets array + blockchain object showing created/updated counts
```

### Test Score Resolution

```bash
# Get scores, resolve markets, and settle bets
curl "http://localhost:3000/api/scores" | jq .

# Expected: scores array + blockchain object showing resolved/settled counts
```

### Check On-Chain Data

```javascript
// In browser console or Node.js
const response = await fetch('/api/markets');
const { markets } = await response.json();
console.log(markets);
```

---

## 🚨 Error Handling

### Common Errors

**"FanDuel bookmaker not found"**
- Market data doesn't include FanDuel odds
- Check mock data has correct bookmaker structure

**"Market already exists"**
- Market was previously created
- API automatically calls `updateMarketOdds` instead

**"Could not find scores for both teams"**
- Score data incomplete or malformed
- Check score response format

**"Failed to resolve market"**
- Market might not exist on-chain
- Ensure market was created first via `/api/markets?sync=true`

### Error Response Format

```json
{
  "error": "Failed to fetch markets",
  "details": "Detailed error message here"
}
```

---

## 🔗 Related Files

- `/app/services/TheOddsApi.ts` - Data provider service
- `/app/services/SportsBettingContract.ts` - Blockchain interaction service
- `/app/types/index.ts` - TypeScript type definitions
- `/app/types/the-odds-api.ts` - The Odds API type definitions
- `/move/sources/sports_betting.move` - Smart contract source

---

## 📝 Notes

- **Mock Data**: Currently using static mock files for development
- **Real API**: Replace `TheOddsApi` service with real API calls when ready
- **Automatic Blockchain Sync**: Every API call writes to the blockchain
- **Rate Limiting**: Markets are processed sequentially to avoid overwhelming the blockchain
- **Gas Costs**: Each market creation/resolution costs gas (paid from Admin 1 wallet)
- **Admin Wallet**: Ensure ADMIN1 has sufficient MOVE tokens for gas
- **Error Handling**: Failed blockchain operations don't prevent API response; check blockchain.errors array

---

## 🚀 Next Steps

1. Replace mock data with real The Odds API calls
2. Set up automated cron jobs for market updates
3. Add monitoring and alerting for failed transactions
4. Implement retry logic for blockchain writes
5. Add pagination for large market lists
6. Implement market filtering and search
7. Add WebSocket support for real-time updates

---

**Last Updated:** November 24, 2025  
**API Version:** 1.0.0  
**Blockchain Network:** Movement Testnet

