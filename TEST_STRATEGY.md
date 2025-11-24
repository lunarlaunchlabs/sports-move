# End-to-End API Integration Test Strategy

## 🎯 Test Objective

Validate the complete sports betting workflow from market creation through bet settlement by simulating a GitHub Action that calls our APIs sequentially.

---

## 📋 Test Workflow

### Sequential Execution

```
1. Sync Markets (GET /api/markets)
   ↓
2. Setup Test User & Mint smUSD
   ↓
3. Place Bets on Markets
   ↓
4. Query Markets & Bets (BEFORE resolution)
   ├─ GET /api/get-markets (all filters)
   └─ GET /api/get-user-bets (all filters)
   ↓
5. Resolve Markets & Settle Bets (GET /api/scores)
   ↓
6. Query Markets & Bets (AFTER resolution)
   ├─ GET /api/get-markets (all filters)
   └─ GET /api/get-user-bets (all filters)
```

---

## 📊 Test Coverage

### API Endpoints (4 total)

| Endpoint | Tested | Operations |
|----------|--------|------------|
| `GET /api/markets` | ✅ | Sync to blockchain |
| `GET /api/get-markets` | ✅ | Query with 4 filters |
| `GET /api/scores` | ✅ | Resolve & settle |
| `GET /api/get-user-bets` | ✅ | Query with 4 filters |

### Filter Combinations (8 total)

**Markets (4):**
- `/api/get-markets` (all)
- `/api/get-markets?filter=active`
- `/api/get-markets?filter=resolved`
- `/api/get-markets?filter=cancelled`

**User Bets (4):**
- `/api/get-user-bets?address=0x...` (all)
- `/api/get-user-bets?address=0x...&filter=active`
- `/api/get-user-bets?address=0x...&filter=resolved`
- `/api/get-user-bets?address=0x...&filter=cancelled`

### State Snapshots (2 sets)

Each set captures 8 filter combinations:

1. **BEFORE Resolution** (8 files)
   - Markets: all, active, resolved, cancelled
   - User Bets: all, active, resolved, cancelled

2. **AFTER Resolution** (8 files)
   - Markets: all, active, resolved, cancelled
   - User Bets: all, active, resolved, cancelled

**Total: 16 filter query results + 3 operation results = 19 JSON files**

---

## 🔍 Verification Strategy

### Pre-Resolution Verification

**Expected State:**
- ✅ All markets are active (not resolved)
- ✅ All user bets are on active markets
- ✅ Resolved market filter returns empty
- ✅ Resolved bets filter returns empty
- ✅ No bets are settled

**Files to Check:**
- `02-markets-before-active.json` - Should contain all markets
- `02-markets-before-resolved.json` - Should be empty
- `03-user-bets-before-active.json` - Should contain all bets
- `03-user-bets-before-resolved.json` - Should be empty

### Post-Resolution Verification

**Expected State:**
- ✅ Markets are resolved (games finished)
- ✅ User bets are on resolved markets
- ✅ Active market filter returns empty (or future games only)
- ✅ All bets show `is_settled: true`
- ✅ Winners received payouts

**Files to Check:**
- `05-markets-after-resolved.json` - Should contain completed games
- `05-markets-after-active.json` - Should be empty
- `06-user-bets-after-resolved.json` - Should contain settled bets
- `06-user-bets-after-active.json` - Should be empty

### Data Consistency Checks

**Count Validation:**
```typescript
// For any query type (markets or bets):
count(all) === count(active) + count(resolved) + count(cancelled)
```

**State Transition:**
```typescript
// Before → After
before.active === after.resolved + after.cancelled
before.resolved === 0
after.active === 0 (or only future games)
```

**Bet Settlement:**
```typescript
// All resolved bets should be settled
resolvedBets.every(bet => bet.is_settled === true)
```

---

## 📁 Output Files

### Location
`/test-results/`

### File Naming Convention

**Operation Responses:**
- `00-test-summary.json` - Complete test summary
- `01-markets-sync-response.json` - Market sync results
- `04-scores-resolution-response.json` - Resolution results

**Before Resolution:**
- `02-markets-before-{filter}.json`
- `03-user-bets-before-{filter}.json`

**After Resolution:**
- `05-markets-after-{filter}.json`
- `06-user-bets-after-{filter}.json`

Where `{filter}` ∈ {all, active, resolved, cancelled}

---

## 🎯 Success Criteria

### Blockchain Operations

- [ ] Markets successfully synced to blockchain
- [ ] Test user registered and funded with smUSD
- [ ] Bets placed on multiple markets
- [ ] Markets resolved with winning outcomes
- [ ] Bets settled and payouts distributed
- [ ] No unexpected errors in blockchain operations

### API Responses

- [ ] All endpoints return 200 status
- [ ] Response structures match expected format
- [ ] Filter logic works correctly (active/resolved/cancelled)
- [ ] Counts are consistent across filters
- [ ] No data loss between operations

### State Transitions

- [ ] Markets transition from active → resolved
- [ ] Bets transition from unsettled → settled
- [ ] Payout amounts calculated correctly
- [ ] House fee (5%) deducted properly
- [ ] Refunds triggered for cancelled markets

### Data Integrity

- [ ] User addresses match across bets and queries
- [ ] Game IDs consistent between markets and bets
- [ ] Odds preserved from market creation to bet placement
- [ ] Timestamps in chronological order
- [ ] Amounts in correct format (8 decimals)

---

## 🔧 Test Configuration

### Environment Variables

Required in `.env`:
```bash
NODE_URL=https://testnet.movementnetwork.xyz/v1
CONTRACT_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5
ADMIN1_PRIVATE_KEY=0x...
ADMIN1_ADDRESS=0x...
```

Optional:
```bash
BASE_URL=http://localhost:3000  # Default
```

### Test Parameters

Edit in `test-api-integration.js`:
- Test user private key (deterministic)
- Bet amounts (default: 100, 200, 300 smUSD)
- Number of markets to bet on (default: 3)
- Delays between operations (default: 1-2 seconds)

---

## 🚀 Running the Test

### Prerequisites

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Ensure Contracts Deployed:**
   - Check `CONTRACT_ADDRESS` in `.env`
   - Verify admin wallet has gas tokens

### Execute Test

```bash
npm run test:api-integration
```

### Expected Output

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    Sports Betting API Integration Test                    ║
║                         End-to-End Workflow Test                           ║
╚════════════════════════════════════════════════════════════════════════════╝

================================================================================
STEP 1: Sync Markets to Blockchain
================================================================================

ℹ️  Calling /api/markets...
✅ Market sync succeeded
✅ Saved: 01-markets-sync-response.json
ℹ️  Markets found: 10
ℹ️  Created on blockchain: 8
ℹ️  Failed: 2

[... continues through all 8 steps ...]

================================================================================
TEST SUMMARY
================================================================================

Total Steps: 8
Passed: 8
Failed: 0
Warnings: 0

JSON Files Generated: 19
  📄 00-test-summary.json
  📄 01-markets-sync-response.json
  [... all files listed ...]

Output Directory: /Users/sameer/sports-move/test-results

✅ 🎉 ALL TESTS PASSED! 🎉
```

---

## 📊 Reviewing Results

### Automated Checks

The test script automatically:
- Validates response structures
- Counts successes/failures
- Reports errors and warnings
- Saves all responses for manual review

### Manual Review

1. **Open test-results directory**
   ```bash
   cd test-results
   ```

2. **Review summary**
   ```bash
   cat 00-test-summary.json | jq .
   ```

3. **Compare before/after states**
   ```bash
   # Markets before resolution
   cat 02-markets-before-active.json | jq '.count'
   
   # Markets after resolution
   cat 05-markets-after-resolved.json | jq '.count'
   
   # Should be equal (active → resolved)
   ```

4. **Verify bet settlement**
   ```bash
   cat 06-user-bets-after-resolved.json | jq '.bets[] | {id: .bet_id, settled: .is_settled}'
   # All should show settled: true
   ```

---

## 🐛 Troubleshooting

### Dev Server Not Running

**Error:** Connection refused

**Solution:**
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:api-integration
```

### Insufficient Gas

**Error:** Transaction failed / Account not found

**Solution:**
```bash
# Fund admin wallet
curl -X POST "https://faucet.testnet.movementnetwork.xyz/mint?amount=100000000&address=YOUR_ADMIN_ADDRESS"
```

### Market Already Exists

**Warning:** Some markets failed to sync

**Explanation:** Normal - markets may already exist from previous tests. The API will update odds instead.

### No Scores to Resolve

**Warning:** No markets resolved

**Explanation:** Mock scores data may not match market IDs. Check `app/services/mocks/mock-scores.json`.

---

## 🔄 GitHub Action Integration

This test simulates the production cron job workflow:

```yaml
name: Update Markets and Settle Bets

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes

jobs:
  update-markets:
    steps:
      - name: Sync Markets
        run: curl "${{ secrets.API_URL }}/api/markets"
      
      - name: Resolve and Settle
        run: curl "${{ secrets.API_URL }}/api/scores"
```

The test validates this workflow works correctly end-to-end.

---

## 📝 Test Maintenance

### Updating Mock Data

1. **Markets:** Edit `app/services/mocks/mock-markets.json`
2. **Scores:** Edit `app/services/mocks/mock-scores.json`
3. **Ensure:** Game IDs match between files

### Adding Test Cases

Modify `test-api-integration.js`:
- Add more bet placements
- Test different bet amounts
- Test edge cases (ties, cancelled games)
- Add custom assertions

### Extending Coverage

Future enhancements:
- Test error handling (invalid addresses, insufficient funds)
- Test concurrent operations
- Test large datasets (100+ markets)
- Performance benchmarks
- Load testing

---

**Last Updated:** November 24, 2025  
**Test Version:** 1.0.0  
**Maintained By:** Development Team

