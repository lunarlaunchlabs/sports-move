# Sports Betting Smart Contracts

Decentralized sports betting platform built on Movement blockchain using Move language.

## Overview

This project consists of two smart contracts:

1. **smUSD Stablecoin** - A mintable stablecoin for betting transactions
2. **Sports Betting Contract** - Fixed-odds betting system with house-backed payouts

## Architecture

### smUSD Stablecoin (`smusd.move`)

A fungible token implementation using Aptos Framework standards with unlimited minting capability.

**Key Features:**
- Unlimited minting to any address
- Standard transfer and burn operations
- 8 decimal precision
- Compatible with Aptos coin standard

**Main Functions:**
- `initialize()` - Deploy the stablecoin (called once)
- `mint(to: address, amount: u64)` - Mint smUSD to any address
- `register(account: &signer)` - Register account to receive smUSD
- `transfer(from: &signer, to: address, amount: u64)` - Transfer tokens
- `balance_of(addr: address): u64` - View balance

### Sports Betting Contract (`sports_betting.move`)

A comprehensive betting platform with multi-admin oracle system and automated settlements.

**Key Features:**
- Fixed American odds (positive/negative)
- House-backed payouts with escrow
- 4 admin oracle addresses for redundancy
- 5% house fee on winnings
- Automated bet settlement by admin cron jobs
- Full refunds for cancelled games

## Contract Components

### Data Structures

#### Market
```move
struct Market {
    game_id: String,
    sport_key: String,
    home_team: String,
    away_team: String,
    commence_time: u64,
    is_resolved: bool,
    is_cancelled: bool,
    winning_outcome: String,
}
```

#### Bet
```move
struct Bet {
    bet_id: u64,
    user: address,
    game_id: String,
    outcome: String,
    amount: u64,
    odds: i64,
    potential_payout: u64,
    is_settled: bool,
    timestamp: u64,
}
```

## Usage Guide

### Initialization

1. **Deploy smUSD Contract:**
```bash
aptos move run --function-id sports_betting::smusd::initialize
```

2. **Deploy Sports Betting Contract:**
```bash
aptos move run \
  --function-id sports_betting::sports_betting::initialize \
  --args address:0xADMIN1 address:0xADMIN2 address:0xADMIN3 address:0xADMIN4
```

### Admin Operations (API/Oracle)

#### Create Market
```bash
aptos move run \
  --function-id sports_betting::sports_betting::create_market \
  --args \
    string:"game_id_123" \
    string:"americanfootball_nfl" \
    string:"San Francisco 49ers" \
    string:"Carolina Panthers" \
    u64:1700000000
```

#### Resolve Market
```bash
aptos move run \
  --function-id sports_betting::sports_betting::resolve_market \
  --args \
    string:"game_id_123" \
    string:"San Francisco 49ers"
```

#### Settle Bets (Auto-payout)
```bash
aptos move run \
  --function-id sports_betting::sports_betting::settle_bets \
  --args string:"game_id_123"
```

#### Cancel Market & Refund
```bash
aptos move run \
  --function-id sports_betting::sports_betting::cancel_market \
  --args string:"game_id_123"
```

#### Deposit House Funds
```bash
aptos move run \
  --function-id sports_betting::sports_betting::deposit_house_funds \
  --args u64:100000000000
```

### User Operations

#### Register for smUSD
```bash
aptos move run --function-id sports_betting::smusd::register
```

#### Mint smUSD (for testing/funding)
```bash
aptos move run \
  --function-id sports_betting::smusd::mint \
  --args address:USER_ADDRESS u64:10000000000
```

#### Place Bet
```bash
aptos move run \
  --function-id sports_betting::sports_betting::place_bet \
  --args \
    string:"game_id_123" \
    string:"San Francisco 49ers" \
    u64:1000000000 \
    i64:320
```

### View Functions

#### Get Market Details
```bash
aptos move view \
  --function-id sports_betting::sports_betting::get_market \
  --args string:"game_id_123"
```

#### Get All Markets
```bash
aptos move view \
  --function-id sports_betting::sports_betting::get_markets
```

#### Get User Bets
```bash
aptos move view \
  --function-id sports_betting::sports_betting::get_user_bets \
  --args address:USER_ADDRESS
```

#### Calculate Potential Payout
```bash
aptos move view \
  --function-id sports_betting::sports_betting::calculate_payout_view \
  --args u64:1000000000 i64:320
```

#### Check House Balance
```bash
aptos move view \
  --function-id sports_betting::sports_betting::get_house_balance
```

## Odds Calculation

### American Odds Format

**Positive Odds (Underdog):**
- Example: +320
- Formula: `payout = bet_amount + (bet_amount * odds / 100)`
- $100 bet at +320 = $420 payout ($100 stake + $320 profit)

**Negative Odds (Favorite):**
- Example: -400
- Formula: `payout = bet_amount + (bet_amount * 100 / abs(odds))`
- $100 bet at -400 = $125 payout ($100 stake + $25 profit)

### House Fee
- 5% fee applied to **profit only** (not the original stake)
- Winning bet: `net_payout = stake + (profit * 0.95)`
- Losing bet: House keeps entire stake

## API Integration

### Markets API (`/api/markets`)
Calls `create_market()` or `update_market()` when new games are available.

```typescript
// Example API endpoint
POST /api/markets/sync
{
  "game_id": "90391be251d876bb41d36978a43c7ac2",
  "sport_key": "americanfootball_nfl",
  "home_team": "San Francisco 49ers",
  "away_team": "Carolina Panthers",
  "commence_time": 1700000000
}
```

### Scores API (`/api/scores`)
Calls `resolve_market()` when game completes, then `settle_bets()` to process payouts.

```typescript
// Example API endpoint
POST /api/scores/resolve
{
  "game_id": "90391be251d876bb41d36978a43c7ac2",
  "winning_team": "San Francisco 49ers",
  "completed": true
}
```

### Cron Job for Settlement
The admin oracle should run a cron job to automatically settle bets:

```bash
#!/bin/bash
# settle_bets.sh

# Get all resolved but unsettled markets
RESOLVED_MARKETS=$(aptos move view --function-id sports_betting::sports_betting::get_markets | jq -r '.[] | select(.is_resolved == true)')

# For each resolved market, settle bets
for MARKET in $RESOLVED_MARKETS; do
  GAME_ID=$(echo $MARKET | jq -r '.game_id')
  aptos move run \
    --function-id sports_betting::sports_betting::settle_bets \
    --args string:"$GAME_ID" \
    --private-key $ADMIN_PRIVATE_KEY
done
```

## Admin Wallet Management

### 4 Admin Addresses
The contract supports 4 admin wallet addresses for redundancy:
1. Primary admin (active)
2. Backup admin #1
3. Backup admin #2
4. Backup admin #3

**Important:**
- Each admin wallet needs sufficient gas tokens to execute transactions
- Fund admin wallets with native blockchain tokens for gas fees
- Rotate keys if one is compromised using `add_admin()` and `remove_admin()`

### Funding Admin Wallets
```bash
# Fund admin wallet with gas tokens
aptos account fund-with-faucet \
  --account ADMIN_ADDRESS \
  --amount 100000000
```

## Testing

Run the test suite:

```bash
cd move
aptos move test
```

### Test Coverage
- ✅ smUSD minting and transfers
- ✅ Market creation and updates
- ✅ Bet placement with odds validation
- ✅ Positive and negative odds calculations
- ✅ Market resolution and settlement
- ✅ Market cancellation and refunds
- ✅ Admin authorization checks
- ✅ Multi-admin management

## Security Considerations

1. **Admin Authorization:** Only authorized admin addresses can create/resolve markets
2. **Bet Immutability:** Bets cannot be modified after placement
3. **Escrow System:** User funds are held in contract until settlement
4. **Automated Refunds:** Cancelled games trigger automatic refunds
5. **House Solvency:** Contract tracks house balance to ensure payout capability

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 1 | `ENOT_ADMIN` | Caller is not an authorized admin |
| 2 | `EMARKET_NOT_FOUND` | Market doesn't exist |
| 3 | `EMARKET_RESOLVED` | Cannot bet on resolved market |
| 4 | `EMARKET_CANCELLED` | Market is cancelled |
| 5 | `EINSUFFICIENT_BALANCE` | User lacks smUSD for bet |
| 6 | `EINSUFFICIENT_HOUSE_FUNDS` | House cannot cover payouts |
| 7 | `EALREADY_SETTLED` | Bet already paid out |
| 8 | `EINVALID_ODDS` | Odds format incorrect |
| 9 | `EBET_NOT_FOUND` | Bet ID doesn't exist |
| 10 | `EALREADY_INITIALIZED` | Contract already initialized |
| 11 | `ENOT_OWNER` | Caller is not contract owner |
| 12 | `EMARKET_NOT_RESOLVED` | Market not yet resolved |

## Events

- `MarketCreatedEvent` - New betting market added
- `BetPlacedEvent` - User placed a bet
- `MarketResolvedEvent` - Outcome determined
- `MarketCancelledEvent` - Game cancelled
- `BetSettledEvent` - Bet settled (win/loss)
- `BetRefundedEvent` - Bet refunded

## Development

### Build
```bash
aptos move compile
```

### Deploy
```bash
aptos move publish
```

### Clean
```bash
aptos move clean
```

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.

