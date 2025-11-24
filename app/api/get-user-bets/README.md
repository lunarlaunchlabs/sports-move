# GET /api/get-user-bets

Fetches all bets for a specific user address from the blockchain with optional filtering.

## 📋 Overview

This endpoint retrieves bets for a specific wallet address directly from the Movement Network blockchain, with the ability to filter by bet status based on the underlying market's state.

---

## 🔌 Endpoint

```
GET /api/get-user-bets
```

---

## 📥 Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | **Yes** | - | User's wallet address (must start with 0x) |
| `filter` | string | No | `"all"` | Filter bets by market status |

### Filter Options

| Value | Description |
|-------|-------------|
| `all` | Returns all bets for the user (default) |
| `active` | Returns bets on active markets (not resolved, not cancelled) |
| `resolved` | Returns bets on resolved markets (game finished) |
| `cancelled` | Returns bets on cancelled markets (refunded) |

---

## 📤 Response Format

```typescript
{
  address: string,       // User address queried
  bets: Bet[],          // Array of bet objects
  filter: string,       // Applied filter
  count: number,        // Number of bets returned
  total: number,        // Total bets for user
  message?: string      // Optional message (e.g., "No bets found")
}
```

### Bet Object Structure

```typescript
{
  bet_id: string,              // Unique bet identifier
  user: string,                // User's wallet address
  game_id: string,             // Game identifier (matches market)
  outcome: string,             // Team name user bet on
  amount: string,              // Bet amount in smUSD (8 decimals)
  odds: string,                // Odds at time of bet (absolute value)
  odds_is_negative: boolean,   // true if odds were negative
  potential_payout: string,    // Potential winnings (8 decimals)
  is_settled: boolean,         // true if bet has been settled
  timestamp: string            // Unix timestamp of bet placement
}
```

---

## 📝 Examples

### Get All Bets for User

```bash
curl "http://localhost:3000/api/get-user-bets?address=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841"
```

**Response:**
```json
{
  "address": "0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841",
  "bets": [
    {
      "bet_id": "1",
      "user": "0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841",
      "game_id": "game_001_49ers_vs_cowboys",
      "outcome": "San Francisco 49ers",
      "amount": "10000000000",
      "odds": "150",
      "odds_is_negative": false,
      "potential_payout": "25000000000",
      "is_settled": false,
      "timestamp": "1732492000"
    }
  ],
  "filter": "all",
  "count": 1,
  "total": 1
}
```

### Get Active Bets Only

```bash
curl "http://localhost:3000/api/get-user-bets?address=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841&filter=active"
```

**Response:**
```json
{
  "address": "0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841",
  "bets": [ /* only bets on active markets */ ],
  "filter": "active",
  "count": 3,
  "total": 10
}
```

### Get Resolved Bets

```bash
curl "http://localhost:3000/api/get-user-bets?address=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841&filter=resolved"
```

**Response:**
```json
{
  "address": "0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841",
  "bets": [ /* only bets on resolved markets */ ],
  "filter": "resolved",
  "count": 5,
  "total": 10
}
```

### Get Cancelled Bets

```bash
curl "http://localhost:3000/api/get-user-bets?address=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841&filter=cancelled"
```

**Response:**
```json
{
  "address": "0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841",
  "bets": [ /* only bets on cancelled markets (refunded) */ ],
  "filter": "cancelled",
  "count": 2,
  "total": 10
}
```

---

## 🎯 Use Cases

### Display User's Active Bets

```typescript
const userAddress = '0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841';
const response = await fetch(`/api/get-user-bets?address=${userAddress}&filter=active`);
const { bets } = await response.json();

// Show user's pending bets
bets.forEach(bet => {
  const amountInSmUSD = parseFloat(bet.amount) / 100_000_000;
  const payoutInSmUSD = parseFloat(bet.potential_payout) / 100_000_000;
  
  console.log(`Bet on: ${bet.outcome}`);
  console.log(`Amount: ${amountInSmUSD} smUSD`);
  console.log(`Potential payout: ${payoutInSmUSD} smUSD`);
  console.log(`Odds: ${bet.odds_is_negative ? '-' : '+'}${bet.odds}`);
});
```

### Check Bet History

```typescript
const response = await fetch(`/api/get-user-bets?address=${userAddress}&filter=resolved`);
const { bets } = await response.json();

// Show win/loss history
bets.forEach(bet => {
  console.log(`Game: ${bet.game_id}`);
  console.log(`Settled: ${bet.is_settled ? 'Yes' : 'No'}`);
});
```

### Calculate Total at Risk

```typescript
const response = await fetch(`/api/get-user-bets?address=${userAddress}&filter=active`);
const { bets } = await response.json();

const totalAtRisk = bets.reduce((sum, bet) => {
  return sum + (parseFloat(bet.amount) / 100_000_000);
}, 0);

console.log(`Total at risk: ${totalAtRisk} smUSD`);
```

### Format Bet Display

```typescript
function formatBet(bet: Bet) {
  return {
    id: bet.bet_id,
    game: bet.game_id,
    pick: bet.outcome,
    stake: `${parseFloat(bet.amount) / 100_000_000} smUSD`,
    odds: `${bet.odds_is_negative ? '-' : '+'}${bet.odds}`,
    toWin: `${parseFloat(bet.potential_payout) / 100_000_000} smUSD`,
    settled: bet.is_settled,
    placedAt: new Date(parseInt(bet.timestamp) * 1000).toLocaleString()
  };
}
```

---

## 🚨 Error Responses

### Missing Address Parameter

**Status:** 400

```json
{
  "error": "Address parameter is required",
  "example": "/api/get-user-bets?address=0x123..."
}
```

### Invalid Address Format

**Status:** 400

```json
{
  "error": "Invalid address format",
  "details": "Address must start with 0x and be a valid hex string"
}
```

### No Bets Found

**Status:** 200

```json
{
  "address": "0x...",
  "bets": [],
  "filter": "all",
  "count": 0,
  "message": "No bets found for this address"
}
```

### Server Error

**Status:** 500

```json
{
  "error": "Failed to fetch user bets",
  "details": "Error message here",
  "address": "0x...",
  "bets": [],
  "count": 0
}
```

---

## 🔗 Related Endpoints

- `GET /api/get-markets` - Get markets with filtering
- `POST /api/place-bet` - Place a new bet (to be implemented)
- `GET /api/scores` - Get scores and resolve markets

---

## 💡 Tips

1. **Performance**: View function, no gas cost
2. **Real-time**: Always current from blockchain
3. **Filtering**: 
   - Use `filter=active` for "My Bets" page
   - Use `filter=resolved` for bet history
   - Use `filter=cancelled` to show refunded bets
4. **Amount Format**: All amounts are in 8-decimal format (divide by 100_000_000 for display)
5. **Bet Status**: Determined by the market's status, not just `is_settled` field
6. **Address Validation**: Frontend should validate address before calling

---

## 🔐 Security Notes

- This is a public read endpoint (no authentication required)
- Anyone can query any address
- For production, consider rate limiting
- Sensitive betting history is publicly visible on blockchain

---

**Last Updated:** November 24, 2025  
**Version:** 1.0.0

