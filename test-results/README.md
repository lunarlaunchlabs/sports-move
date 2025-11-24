# API Integration Test Results

This directory contains JSON output files from the end-to-end API integration test.

## 📋 Test Overview

The integration test simulates a complete GitHub Action workflow:

1. **Sync Markets** - Fetch from The Odds API and write to blockchain
2. **Setup User** - Register test user and mint smUSD
3. **Place Bets** - User places bets on active markets
4. **Query Before** - Capture state before resolution (8 queries)
5. **Resolve Markets** - Determine winners and settle bets
6. **Query After** - Capture state after resolution (8 queries)

---

## 📁 Generated Files

### Test Summary

**`00-test-summary.json`**
- Complete test execution summary
- Step-by-step results
- Pass/fail status for each step
- List of all generated JSON files

---

### Market Sync Response

**`01-markets-sync-response.json`**
- Response from `GET /api/markets`
- Markets fetched from The Odds API
- Blockchain sync results (created/updated/failed)
- Error details for failed syncs

**Contents:**
```json
{
  "markets": [ /* array of market data */ ],
  "blockchain": {
    "total": number,
    "created": number,
    "updated": number,
    "failed": number,
    "errors": string[]
  }
}
```

---

### Markets Query (BEFORE Resolution)

These files capture market state before any games are resolved:

**`02-markets-before-all.json`**
- All markets on blockchain
- Filter: `all`

**`02-markets-before-active.json`**
- Only active markets (not resolved, not cancelled)
- Filter: `active`
- **Expected:** Should contain all markets (nothing resolved yet)

**`02-markets-before-resolved.json`**
- Only resolved markets
- Filter: `resolved`
- **Expected:** Should be empty (nothing resolved yet)

**`02-markets-before-cancelled.json`**
- Only cancelled markets
- Filter: `cancelled`
- **Expected:** Should be empty or contain any pre-cancelled markets

**Contents:**
```json
{
  "markets": [ /* filtered market array */ ],
  "filter": "active|resolved|cancelled|all",
  "count": number,
  "total": number
}
```

---

### User Bets Query (BEFORE Resolution)

These files capture user's bets before markets are resolved:

**`03-user-bets-before-all.json`**
- All bets for test user
- Filter: `all`

**`03-user-bets-before-active.json`**
- User's bets on active markets
- Filter: `active`
- **Expected:** Should contain all placed bets (games not finished)

**`03-user-bets-before-resolved.json`**
- User's bets on resolved markets
- Filter: `resolved`
- **Expected:** Should be empty (no games finished yet)

**`03-user-bets-before-cancelled.json`**
- User's bets on cancelled markets
- Filter: `cancelled`
- **Expected:** Should be empty (no games cancelled yet)

**Contents:**
```json
{
  "address": "0x...",
  "bets": [ /* filtered bet array */ ],
  "filter": "active|resolved|cancelled|all",
  "count": number,
  "total": number
}
```

---

### Resolution Response

**`04-scores-resolution-response.json`**
- Response from `GET /api/scores`
- Game scores from The Odds API
- Market resolution results
- Bet settlement results

**Contents:**
```json
{
  "scores": [ /* array of score data */ ],
  "blockchain": {
    "total": number,
    "resolved": number,
    "settled": number,
    "cancelled": number,
    "failed": number,
    "errors": string[]
  }
}
```

---

### Markets Query (AFTER Resolution)

These files capture market state after games are resolved:

**`05-markets-after-all.json`**
- All markets on blockchain
- Filter: `all`

**`05-markets-after-active.json`**
- Only active markets
- Filter: `active`
- **Expected:** Should be empty or contain only future games

**`05-markets-after-resolved.json`**
- Only resolved markets
- Filter: `resolved`
- **Expected:** Should contain all completed games

**`05-markets-after-cancelled.json`**
- Only cancelled markets
- Filter: `cancelled`
- **Expected:** Should contain any tied games or cancelled events

---

### User Bets Query (AFTER Resolution)

These files capture user's bets after markets are resolved:

**`06-user-bets-after-all.json`**
- All bets for test user
- Filter: `all`

**`06-user-bets-after-active.json`**
- User's bets on active markets
- Filter: `active`
- **Expected:** Should be empty (all games finished)

**`06-user-bets-after-resolved.json`**
- User's bets on resolved markets
- Filter: `resolved`
- **Expected:** Should contain all placed bets (games finished)
- Check `is_settled: true` for paid out bets

**`06-user-bets-after-cancelled.json`**
- User's bets on cancelled markets
- Filter: `cancelled`
- **Expected:** Should contain any refunded bets

---

## 🔍 Verification Checklist

### Before Resolution Files (02-*, 03-*)

- [ ] `02-markets-before-active.json` contains all synced markets
- [ ] `02-markets-before-resolved.json` is empty
- [ ] `03-user-bets-before-active.json` contains all placed bets
- [ ] `03-user-bets-before-resolved.json` is empty

### After Resolution Files (05-*, 06-*)

- [ ] `05-markets-after-resolved.json` contains completed games
- [ ] `05-markets-after-active.json` is empty (or only future games)
- [ ] `06-user-bets-after-resolved.json` contains all bets with `is_settled: true`
- [ ] `06-user-bets-after-active.json` is empty

### Data Consistency

- [ ] Total counts match across all/active/resolved/cancelled
- [ ] Bet amounts match potential payouts based on odds
- [ ] Winning outcomes match resolved markets
- [ ] Settled bets show correct payout amounts

### Blockchain Sync

- [ ] `01-markets-sync-response.json` shows successful market creation
- [ ] `04-scores-resolution-response.json` shows successful resolution
- [ ] Error arrays are empty or contain expected failures

---

## 📊 Data Structure Reference

### Market Object
```typescript
{
  game_id: string,
  sport_key: string,
  sport_title: string,
  home_team: string,
  away_team: string,
  commence_time: number,        // Unix timestamp
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
  user: string,                 // Wallet address
  game_id: string,
  outcome: string,              // Team name
  amount: string,               // 8 decimals (e.g., "10000000000" = 100 smUSD)
  odds: string,
  odds_is_negative: boolean,
  potential_payout: string,     // 8 decimals
  is_settled: boolean,
  timestamp: string
}
```

---

## 🎯 Expected Behavior

### Filter Logic

**Active Filter:**
- Markets: `!is_resolved && !is_cancelled`
- Bets: On markets that are `!is_resolved && !is_cancelled`

**Resolved Filter:**
- Markets: `is_resolved && !is_cancelled`
- Bets: On markets that are `is_resolved && !is_cancelled`

**Cancelled Filter:**
- Markets: `is_cancelled`
- Bets: On markets that are `is_cancelled`

### Count Relationships

For each query type (markets or user bets):
```
count(all) = count(active) + count(resolved) + count(cancelled)
```

---

## 🚀 Running the Test

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run the test
npm run test:api-integration
```

---

## 🔧 Test Configuration

Edit `test-api-integration.js` to customize:

- `BASE_URL` - API server URL (default: http://localhost:3000)
- Test user bet amounts
- Number of bets to place
- Delay times between operations

---

## 📝 Notes

- Tests use mock data from `app/services/mocks/`
- Blockchain operations require gas (from ADMIN1)
- Test creates a deterministic test user account
- Each test run overwrites previous results
- Timestamps in filenames help track test runs

---

**Generated by:** `npm run test:api-integration`  
**Last Updated:** November 24, 2025

