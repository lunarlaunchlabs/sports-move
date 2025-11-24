# Quick Start Guide

## 🎯 What We Built

Two Move smart contracts for decentralized sports betting:
1. **smUSD** - Mintable stablecoin for betting
2. **Sports Betting** - Full-featured betting platform with automated settlement

## 📁 File Structure

```
/Users/sameer/sports-move/
├── move/                           # Smart contracts
│   ├── Move.toml                   # Package configuration
│   ├── sources/
│   │   ├── smusd.move             # Stablecoin contract
│   │   ├── sports_betting.move    # Main betting contract
│   │   └── tests/                 # Unit tests
│   ├── README.md                  # Full documentation
│   ├── API_INTEGRATION.md         # Next.js integration guide
│   └── DEPLOYMENT.md              # Deployment steps
├── test-sports-move-contracts.js  # Integration test script
├── TEST_RESULTS.md                # Test execution results
└── QUICK_START.md                 # This file
```

## ⚡ Quick Commands

### Run Integration Tests
```bash
node test-sports-move-contracts.js
```

### Compile Contracts (requires Aptos CLI)
```bash
cd move
aptos move compile
```

### Deploy Contracts
```bash
cd move
aptos move publish --named-addresses sports_betting=YOUR_ADDRESS
```

## 🔑 Key Features

### smUSD Stablecoin
- ✅ Unlimited minting to any address
- ✅ Standard ERC20-like operations
- ✅ 8 decimal precision
- ✅ Used for all betting transactions

### Sports Betting Platform
- ✅ **Fixed American Odds** - Positive (+150) and negative (-200) odds
- ✅ **House-Backed Payouts** - Losers pay winners
- ✅ **5% House Fee** - Only on profits, not stakes
- ✅ **Automated Settlement** - Admin settles via cron job
- ✅ **Full Refunds** - 100% refund on cancelled games
- ✅ **Multi-Admin** - 4 admin addresses for redundancy
- ✅ **Comprehensive Views** - Query markets, bets, balances

## 📊 Test Results Summary

**Status:** ✅ ALL TESTS PASSED

- Accounts created and funded: ✅
- smUSD operations: ✅
- Market creation: ✅
- Bet placement: ✅
- Settlement with fees: ✅
- Cancellation with refunds: ✅
- View functions: ✅
- Admin operations: ✅

See `TEST_RESULTS.md` for detailed results.

## 🎮 How It Works

### For Users

1. **Fund Wallet**
   - Receive smUSD from admin or exchange
   - Register for smUSD token

2. **Place Bet**
   ```
   place_bet(game_id, outcome, amount, odds)
   ```
   - Funds escrowed immediately
   - Odds locked at bet time
   - Potential payout calculated

3. **Auto-Settlement**
   - Admin resolves game
   - Admin settles bets
   - Winners receive payout automatically (no claim needed)
   - 5% fee on profits only

### For Admins

1. **Create Market**
   ```
   create_market(game_id, sport, home_team, away_team, time)
   ```

2. **Resolve & Settle** (after game completes)
   ```
   resolve_market(game_id, winning_team)
   settle_bets(game_id)  // Pays out all bets
   ```

3. **Cancel** (if game postponed)
   ```
   cancel_market(game_id)  // Refunds all bets
   ```

## 💰 Economics Example

### Winning Bet (+150 odds)
```
Bet: 100 smUSD at +150
Gross Payout: 250 smUSD (100 stake + 150 profit)
House Fee: 7.50 smUSD (5% of 150 profit)
Net Payout: 242.50 smUSD
User Profit: 142.50 smUSD
```

### Losing Bet
```
Bet: 100 smUSD
Payout: 0 smUSD
House Profit: 100 smUSD
```

### Cancelled Game
```
Bet: 100 smUSD
Refund: 100 smUSD (100%)
Fee: 0 smUSD
```

## 🔐 Admin Addresses

The contract supports 4 admin addresses for redundancy:
- Admin 1: Primary oracle (active)
- Admin 2: Backup #1
- Admin 3: Backup #2
- Admin 4: Backup #3

**Important:** Fund all admin wallets with gas tokens!

## 🌐 API Integration

### Market Sync (from The Odds API)
```javascript
POST /api/markets
{
  "action": "sync"
}
// Calls: create_market() for each game
```

### Score Resolution
```javascript
POST /api/scores
{
  "action": "resolve"
}
// Calls: resolve_market() then settle_bets()
```

### Cron Job (every 5 minutes)
```
GET /api/cron/settle-bets
// Automatically settles completed games
```

## 📚 Documentation

- **README.md** - Complete usage guide with examples
- **API_INTEGRATION.md** - Next.js integration code
- **DEPLOYMENT.md** - Step-by-step deployment
- **TEST_RESULTS.md** - Detailed test results

## 🐛 Troubleshooting

### "Insufficient funds"
- User needs more smUSD
- House balance too low

### "Not authorized"
- Caller must be admin
- Admin needs gas tokens

### "Market not found"
- Check game_id matches exactly
- Verify market was created

## 🚀 Deployment Checklist

- [ ] Install Aptos CLI
- [ ] Compile contracts
- [ ] Deploy to testnet
- [ ] Initialize both contracts
- [ ] Fund admin wallets with gas
- [ ] Deposit house balance (smUSD)
- [ ] Test on testnet
- [ ] Integrate APIs
- [ ] Set up cron jobs
- [ ] Monitor & test
- [ ] Deploy to mainnet

## 📞 Support

- Check error codes in `README.md`
- Review test results in `TEST_RESULTS.md`
- Consult API guide in `API_INTEGRATION.md`

## 🎉 You're Ready!

Run the test to see everything in action:
```bash
node test-sports-move-contracts.js
```

Then follow `DEPLOYMENT.md` to deploy to blockchain.

**Happy Betting! 🎲**

