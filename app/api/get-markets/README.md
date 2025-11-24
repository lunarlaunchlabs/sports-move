# GET /api/get-markets

Fetches betting markets from the blockchain with optional filtering.

## 📋 Overview

This endpoint retrieves markets directly from the Movement Network blockchain, allowing you to filter by market status (active, resolved, or cancelled).

---

## 🔌 Endpoint

```
GET /api/get-markets
```

---

## 📥 Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filter` | string | No | `"all"` | Filter markets by status |

### Filter Options

| Value | Description |
|-------|-------------|
| `all` | Returns all markets (default) |
| `active` | Returns only active markets (not resolved, not cancelled) |
| `resolved` | Returns only resolved markets (game finished, winner determined) |
| `cancelled` | Returns only cancelled markets (refunds triggered) |

---

## 📤 Response Format

```typescript
{
  markets: OnChainMarket[],  // Array of market objects
  filter: string,             // Applied filter
  count: number,              // Number of markets returned
  total: number               // Total markets on-chain
}
```

### Market Object Structure

```typescript
{
  game_id: string,              // Unique game identifier
  sport_key: string,            // Sport type (e.g., "americanfootball_nfl")
  sport_title: string,          // Sport display name (e.g., "NFL")
  home_team: string,            // Home team name
  away_team: string,            // Away team name
  commence_time: number,        // Unix timestamp of game start
  home_odds: number,            // Home team odds (absolute value)
  away_odds: number,            // Away team odds (absolute value)
  home_odds_is_negative: boolean,  // true if home odds are negative
  away_odds_is_negative: boolean,  // true if away odds are negative
  is_resolved: boolean,         // true if game has been resolved
  is_cancelled: boolean,        // true if market was cancelled
  winning_outcome: string       // Winner team name (if resolved)
}
```

---

## 📝 Examples

### Get All Markets

```bash
curl "http://localhost:3000/api/get-markets"
```

**Response:**
```json
{
  "markets": [
    {
      "game_id": "game_001_49ers_vs_cowboys",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "home_team": "San Francisco 49ers",
      "away_team": "Dallas Cowboys",
      "commence_time": 1732492800,
      "home_odds": 150,
      "away_odds": 200,
      "home_odds_is_negative": false,
      "away_odds_is_negative": true,
      "is_resolved": false,
      "is_cancelled": false,
      "winning_outcome": ""
    }
  ],
  "filter": "all",
  "count": 1,
  "total": 1
}
```

### Get Active Markets Only

```bash
curl "http://localhost:3000/api/get-markets?filter=active"
```

**Response:**
```json
{
  "markets": [ /* only active markets */ ],
  "filter": "active",
  "count": 5,
  "total": 10
}
```

### Get Resolved Markets

```bash
curl "http://localhost:3000/api/get-markets?filter=resolved"
```

**Response:**
```json
{
  "markets": [
    {
      "game_id": "game_002_lions_vs_packers",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "home_team": "Detroit Lions",
      "away_team": "Green Bay Packers",
      "commence_time": 1732496400,
      "home_odds": 120,
      "away_odds": 140,
      "home_odds_is_negative": false,
      "away_odds_is_negative": true,
      "is_resolved": true,
      "is_cancelled": false,
      "winning_outcome": "Detroit Lions"
    }
  ],
  "filter": "resolved",
  "count": 1,
  "total": 10
}
```

### Get Cancelled Markets

```bash
curl "http://localhost:3000/api/get-markets?filter=cancelled"
```

**Response:**
```json
{
  "markets": [ /* only cancelled markets */ ],
  "filter": "cancelled",
  "count": 2,
  "total": 10
}
```

---

## 🎯 Use Cases

### Display Active Betting Markets

```typescript
const response = await fetch('/api/get-markets?filter=active');
const { markets } = await response.json();

// Show markets users can bet on
markets.forEach(market => {
  console.log(`${market.home_team} vs ${market.away_team}`);
  console.log(`Home: ${market.home_odds_is_negative ? '-' : '+'}${market.home_odds}`);
  console.log(`Away: ${market.away_odds_is_negative ? '-' : '+'}${market.away_odds}`);
});
```

### Show Game Results

```typescript
const response = await fetch('/api/get-markets?filter=resolved');
const { markets } = await response.json();

// Display completed games with winners
markets.forEach(market => {
  console.log(`Winner: ${market.winning_outcome}`);
});
```

### Check Market Status

```typescript
const response = await fetch('/api/get-markets');
const { markets, count, total } = await response.json();

console.log(`Total markets: ${total}`);
console.log(`Active: ${markets.filter(m => !m.is_resolved && !m.is_cancelled).length}`);
console.log(`Resolved: ${markets.filter(m => m.is_resolved).length}`);
console.log(`Cancelled: ${markets.filter(m => m.is_cancelled).length}`);
```

---

## 🚨 Error Responses

### Server Error

**Status:** 500

```json
{
  "error": "Failed to fetch markets",
  "details": "Error message here",
  "markets": [],
  "count": 0
}
```

---

## 🔗 Related Endpoints

- `GET /api/markets` - Fetch from The Odds API and sync to blockchain
- `GET /api/get-user-bets` - Get bets for a specific user
- `GET /api/scores` - Fetch scores and resolve markets

---

## 💡 Tips

1. **Performance**: This endpoint reads directly from blockchain (view function, no gas cost)
2. **Real-time**: Data is always current from the blockchain
3. **Filtering**: Use `filter=active` for user-facing betting interface
4. **History**: Use `filter=resolved` for results/history page
5. **Monitoring**: Check `filter=cancelled` for cancelled/refunded games

---

**Last Updated:** November 24, 2025  
**Version:** 1.0.0

