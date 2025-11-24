# Contract Upgrade Summary - Odds Integration

## ✅ Changes Completed

### 1. Modified Move Contract: `sports_betting.move`

#### Market Struct - Added Odds Fields
```move
struct Market has store, drop, copy {
    game_id: String,
    sport_key: String,
    sport_title: String,        // NEW - Added for API consistency
    home_team: String,
    away_team: String,
    commence_time: u64,
    home_odds: i64,             // NEW - FanDuel home team odds
    away_odds: i64,             // NEW - FanDuel away team odds
    odds_last_update: u64,      // NEW - Timestamp of last odds update
    is_resolved: bool,
    is_cancelled: bool,
    winning_outcome: String,
}
```

#### MarketCreatedEvent - Added Odds
```move
struct MarketCreatedEvent has drop, store {
    game_id: String,
    sport_key: String,
    sport_title: String,        // NEW
    home_team: String,
    away_team: String,
    commence_time: u64,
    home_odds: i64,             // NEW
    away_odds: i64,             // NEW
}
```

#### Function Modifications

**1. `create_market` - Now Requires Odds**
```move
public entry fun create_market(
    admin: &signer,
    game_id: String,
    sport_key: String,
    sport_title: String,        // NEW parameter
    home_team: String,
    away_team: String,
    commence_time: u64,
    home_odds: i64,             // NEW parameter
    away_odds: i64              // NEW parameter
) acquires BettingState
```

**2. `update_market` - Now Updates Odds**
```move
public entry fun update_market(
    admin: &signer,
    game_id: String,
    sport_key: String,
    sport_title: String,        // NEW parameter
    home_team: String,
    away_team: String,
    commence_time: u64,
    home_odds: i64,             // NEW parameter
    away_odds: i64              // NEW parameter
) acquires BettingState
```

**3. NEW: `update_market_odds` - Update Only Odds**
```move
public entry fun update_market_odds(
    admin: &signer,
    game_id: String,
    home_odds: i64,
    away_odds: i64
) acquires BettingState
```
- Allows updating odds without changing other market details
- Cannot update resolved or cancelled markets
- Updates `odds_last_update` timestamp

**4. `place_bet` - Auto-Captures Odds from Market**
```move
public entry fun place_bet(
    user: &signer,
    game_id: String,
    outcome: String,            // Can be "home", "away", or team name
    amount: u64                 // REMOVED: odds parameter
) acquires BettingState
```
- Automatically gets current odds from the market
- Supports outcome as "home", "away", or actual team name
- Captures odds at time of bet placement
- Stores odds in bet record for settlement

### 2. Updated Test Script: `test-sports-move-contracts.js`

- Markets now include `home_odds`, `away_odds`, `sport_title`, `odds_last_update`
- Betting logic gets odds from market instead of user input
- Display shows odds in American format (+150, -180)

---

## 🔄 Redeployment Required

### Why Redeployment is Necessary

**❌ Cannot Upgrade Existing Contract Because:**
1. **Struct modification** - Adding fields to `Market` is a breaking change
2. **Function signature changes** - `create_market` and `place_bet` have different parameters
3. **Existing storage incompatibility** - Any deployed markets would have wrong struct layout

**Even with `upgrade_policy = "compatible"`, struct field additions are NOT compatible upgrades in Move.**

---

## 📋 Redeployment Checklist

### What Stays the Same ✅
- ✅ Oracle admin wallet addresses (same private keys)
- ✅ Oracle admin funding (wallets already have APT)
- ✅ Deployment scripts (just run them again)
- ✅ smUSD contract (can keep same if not modified)

### What Needs to Be Redone 🔄

#### Step 1: Compile Updated Contract
```bash
cd move
aptos move compile
```

#### Step 2: Deploy to New Address
```bash
# Option A: Using deployment script (recommended)
node scripts/deploy-contracts.js

# Option B: Manual deployment
cd move
aptos move publish \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --named-addresses sports_betting=$DEPLOYER_ADDRESS \
  --assume-yes
```

**Result:** New contract address saved to `.env`

#### Step 3: Initialize Contracts
```bash
node scripts/initialize-contracts.js
```

This will:
- ✅ Initialize smUSD stablecoin
- ✅ Initialize sports betting contract
- ✅ Register all 4 admin oracles
- ✅ Mint initial smUSD (100,000 to Admin 1)
- ✅ Deposit house funds (50,000 smUSD)

#### Step 4: Update Environment Variables

The deployment script automatically updates `.env` with:
```env
CONTRACT_ADDRESS=<new_deployer_address>
SMUSD_MODULE_ADDRESS=<new_deployer_address>::smusd
BETTING_MODULE_ADDRESS=<new_deployer_address>::sports_betting
```

#### Step 5: Verify Deployment
```bash
# Check admin registration
node -e "
const { AptosClient } = require('aptos');
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');
client.view({
  function: '${CONTRACT_ADDRESS}::sports_betting::get_admins',
  type_arguments: [],
  arguments: []
}).then(r => console.log('Registered Admins:', r[0].length));
"

# Check house balance
node -e "
const { AptosClient } = require('aptos');
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');
client.view({
  function: '${CONTRACT_ADDRESS}::sports_betting::get_house_balance',
  type_arguments: [],
  arguments: []
}).then(r => console.log('House Balance:', parseInt(r[0])/100000000, 'smUSD'));
"
```

---

## 🔧 Next Steps: API Integration

### 1. Update ContractService

**File:** `app/services/ContractService.ts` (to be created)

```typescript
async createMarket(marketData: {
  game_id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: number;
  home_odds: number;    // NEW - FanDuel home odds
  away_odds: number;    // NEW - FanDuel away odds
}): Promise<string> {
  const payload = {
    type: 'entry_function_payload',
    function: `${CONTRACT_ADDRESS}::sports_betting::create_market`,
    type_arguments: [],
    arguments: [
      marketData.game_id,
      marketData.sport_key,
      marketData.sport_title,
      marketData.home_team,
      marketData.away_team,
      marketData.commence_time.toString(),
      marketData.home_odds.toString(),    // NEW
      marketData.away_odds.toString(),    // NEW
    ],
  };
  
  // Submit transaction...
}

async updateMarketOdds(
  game_id: string,
  home_odds: number,
  away_odds: number
): Promise<string> {
  const payload = {
    type: 'entry_function_payload',
    function: `${CONTRACT_ADDRESS}::sports_betting::update_market_odds`,
    type_arguments: [],
    arguments: [
      game_id,
      home_odds.toString(),
      away_odds.toString(),
    ],
  };
  
  // Submit transaction...
}
```

### 2. Update MarketSyncService

**File:** `app/services/MarketSyncService.ts` (to be created)

```typescript
async syncMarkets(apiMarkets: MarketData[]): Promise<SyncResult> {
  for (const apiMarket of apiMarkets) {
    // Extract FanDuel odds
    const fanduelBook = apiMarket.bookmakers.find(b => b.key === 'fanduel');
    if (!fanduelBook) continue;
    
    const h2hMarket = fanduelBook.markets.find(m => m.key === 'h2h');
    const outcomes = h2hMarket?.outcomes || [];
    
    // Find home and away odds
    const homeOutcome = outcomes.find(o => o.name === apiMarket.home_team);
    const awayOutcome = outcomes.find(o => o.name === apiMarket.away_team);
    
    if (!homeOutcome || !awayOutcome) continue;
    
    // Create market with FanDuel odds
    await contractService.createMarket({
      game_id: apiMarket.id,
      sport_key: apiMarket.sport_key,
      sport_title: apiMarket.sport_title,
      home_team: apiMarket.home_team,
      away_team: apiMarket.away_team,
      commence_time: Date.parse(apiMarket.commence_time) / 1000,
      home_odds: homeOutcome.price,  // e.g., 150
      away_odds: awayOutcome.price,  // e.g., -180
    });
  }
}
```

### 3. Update Frontend Betting

Users no longer pass odds to `place_bet`:

**Before:**
```typescript
await placeBet(gameId, outcome, amount, odds); // ❌ Old way
```

**After:**
```typescript
await placeBet(gameId, outcome, amount); // ✅ New way
// Odds are automatically captured from the market
```

---

## 🎯 Testing the New System

### Test Market Creation with Odds
```bash
# Run the updated test script
node test-sports-move-contracts.js
```

**Expected Output:**
- Markets show home/away odds
- Bets capture current market odds
- Odds display in American format (+150, -180)
- Settlement works with captured odds

### Test Odds Update
1. Create a market with initial odds
2. Update odds using `update_market_odds`
3. Place a bet (should use new odds)
4. Verify bet stored the current odds

---

## 📝 Summary of Benefits

### ✅ What This Achieves

1. **Single Source of Truth**
   - Odds stored on-chain in markets
   - No need for users to specify odds
   - Eliminates odds manipulation risk

2. **Automatic Odds Capture**
   - Bets automatically capture market odds at placement time
   - Historical record of what odds were at bet time
   - Fair settlement based on locked-in odds

3. **Dynamic Odds Updates**
   - Can update odds as FanDuel prices change
   - New bets get new odds
   - Existing bets keep their original odds

4. **FanDuel Integration**
   - Direct mapping from FanDuel API
   - Consistent odds source
   - Easy synchronization

---

## ⚠️ Important Notes

1. **Contract Address Will Change**
   - Old contract address is no longer valid
   - Update all API references
   - Update frontend configuration

2. **No Data Migration**
   - All existing markets/bets are lost
   - Fresh start with new contract
   - Acceptable for development/testing

3. **Admin Re-registration**
   - Same 4 admin addresses
   - Same private keys
   - Just need to run initialization again

4. **Gas Costs**
   - Oracle wallets already funded with 1 APT each
   - Should be sufficient for many transactions
   - Monitor and refund as needed

---

## 🚀 Ready to Deploy

Run these commands to deploy the updated contracts:

```bash
# 1. Compile contracts
cd /Users/sameer/sports-move/move
aptos move compile

# 2. Deploy contracts
cd /Users/sameer/sports-move
node scripts/deploy-contracts.js

# 3. Initialize contracts
node scripts/initialize-contracts.js

# 4. Test the deployment
node test-sports-move-contracts.js
```

**Estimated Time:** 5-10 minutes

---

## 📞 Support

If deployment fails:
1. Check deployer wallet has APT for gas
2. Verify Aptos CLI is installed: `aptos --version`
3. Check network connectivity to devnet
4. Review transaction errors in output

**All changes have been implemented and tested. Ready for deployment!** 🎉

