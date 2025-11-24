# Deployment Guide

Step-by-step guide to deploy the sports betting smart contracts.

## Prerequisites

1. **Install Aptos CLI:**
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

2. **Create/Import Wallet:**
```bash
# Create new wallet
aptos init

# Or import existing wallet
aptos init --private-key YOUR_PRIVATE_KEY
```

3. **Fund Your Wallet:**
```bash
# For testnet
aptos account fund-with-faucet --account YOUR_ADDRESS

# For mainnet, acquire APTOS tokens from an exchange
```

## Step 1: Compile Contracts

```bash
cd /Users/sameer/sports-move/move
aptos move compile
```

Expected output:
```
{
  "Result": [
    "sports_betting::smusd",
    "sports_betting::sports_betting"
  ]
}
```

## Step 2: Run Tests

```bash
aptos move test
```

All tests should pass:
- ✅ smUSD initialization
- ✅ Mint and transfer
- ✅ Market creation
- ✅ Bet placement
- ✅ Odds calculations
- ✅ Settlement and refunds

## Step 3: Deploy Contracts

### Testnet Deployment

```bash
aptos move publish \
  --named-addresses sports_betting=YOUR_ADDRESS \
  --assume-yes
```

### Mainnet Deployment

```bash
aptos move publish \
  --named-addresses sports_betting=YOUR_ADDRESS \
  --network mainnet \
  --assume-yes
```

Save the deployed contract address for later use.

## Step 4: Initialize smUSD

```bash
aptos move run \
  --function-id YOUR_ADDRESS::smusd::initialize \
  --assume-yes
```

## Step 5: Initialize Sports Betting Contract

Replace with your 4 admin wallet addresses:

```bash
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::initialize \
  --args \
    address:ADMIN1_ADDRESS \
    address:ADMIN2_ADDRESS \
    address:ADMIN3_ADDRESS \
    address:ADMIN4_ADDRESS \
  --assume-yes
```

## Step 6: Fund Admin Wallets

Each admin wallet needs gas for transactions:

```bash
# Fund each admin wallet
aptos account fund-with-faucet --account ADMIN1_ADDRESS
aptos account fund-with-faucet --account ADMIN2_ADDRESS
aptos account fund-with-faucet --account ADMIN3_ADDRESS
aptos account fund-with-faucet --account ADMIN4_ADDRESS
```

## Step 7: Fund House Balance

The house needs smUSD to pay out winnings:

```bash
# First, mint smUSD to the admin account
aptos move run \
  --function-id YOUR_ADDRESS::smusd::mint \
  --args address:YOUR_ADMIN_ADDRESS u64:100000000000000 \
  --assume-yes

# Register the admin for smUSD
aptos move run \
  --function-id YOUR_ADDRESS::smusd::register \
  --assume-yes

# Deposit to house balance (e.g., 1,000,000 smUSD = 100000000000000 base units)
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::deposit_house_funds \
  --args u64:100000000000000 \
  --assume-yes
```

## Step 8: Configure Environment Variables

Create `.env.local` in your Next.js project:

```env
# Contract
CONTRACT_ADDRESS=0x... # Your deployed contract address
NETWORK=testnet # or mainnet

# Admin wallet (keep secure!)
ADMIN_PRIVATE_KEY=0x... # Admin private key for API operations

# Cron secret
CRON_SECRET=your-random-secret-here

# The Odds API
ODDS_API_KEY=your-odds-api-key
```

## Step 9: Verify Deployment

Test the deployment with view functions:

```bash
# Check if contract is initialized
aptos move view \
  --function-id YOUR_ADDRESS::sports_betting::get_admins

# Check house balance
aptos move view \
  --function-id YOUR_ADDRESS::sports_betting::get_house_balance

# Check smUSD info
aptos move view \
  --function-id YOUR_ADDRESS::smusd::get_coin_info
```

## Step 10: Create First Market (Test)

```bash
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::create_market \
  --args \
    string:"test_game_1" \
    string:"americanfootball_nfl" \
    string:"Team A" \
    string:"Team B" \
    u64:$(date -d '+1 day' +%s) \
  --assume-yes
```

## Step 11: Setup Cron Jobs

### Option 1: Vercel Cron (Recommended)

Deploy to Vercel and configure cron in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/settle-bets",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 2: Server Cron

Add to crontab on your server:

```bash
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/settle-bets
```

### Option 3: GitHub Actions

Create `.github/workflows/settle-bets.yml`:

```yaml
name: Settle Bets

on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes

jobs:
  settle:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger settle-bets endpoint
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/settle-bets
```

## Step 12: Test End-to-End

1. **Mint smUSD to test user:**
```bash
aptos move run \
  --function-id YOUR_ADDRESS::smusd::mint \
  --args address:TEST_USER_ADDRESS u64:10000000000 \
  --assume-yes
```

2. **Create a test market:**
```bash
# (Already done in Step 10)
```

3. **Place a bet (as test user):**
```bash
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::place_bet \
  --args \
    string:"test_game_1" \
    string:"Team A" \
    u64:1000000000 \
    i64:150 \
  --assume-yes
```

4. **Resolve the market:**
```bash
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::resolve_market \
  --args \
    string:"test_game_1" \
    string:"Team A" \
  --assume-yes
```

5. **Settle bets:**
```bash
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::settle_bets \
  --args string:"test_game_1" \
  --assume-yes
```

6. **Check user balance:**
```bash
aptos move view \
  --function-id YOUR_ADDRESS::smusd::balance_of \
  --args address:TEST_USER_ADDRESS
```

## Monitoring & Maintenance

### View Functions for Monitoring

```bash
# Get all markets
aptos move view \
  --function-id YOUR_ADDRESS::sports_betting::get_markets

# Get house balance
aptos move view \
  --function-id YOUR_ADDRESS::sports_betting::get_house_balance

# Get user bets
aptos move view \
  --function-id YOUR_ADDRESS::sports_betting::get_user_bets \
  --args address:USER_ADDRESS
```

### Admin Operations

```bash
# Add new admin
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::add_admin \
  --args address:NEW_ADMIN_ADDRESS \
  --assume-yes

# Remove admin
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::remove_admin \
  --args address:ADMIN_TO_REMOVE \
  --assume-yes

# Cancel market (for postponed/cancelled games)
aptos move run \
  --function-id YOUR_ADDRESS::sports_betting::cancel_market \
  --args string:GAME_ID \
  --assume-yes
```

## Security Checklist

- [ ] Admin private keys stored securely (use environment variables, never commit)
- [ ] CRON_SECRET is random and secure
- [ ] Admin wallets have sufficient gas
- [ ] House balance is adequately funded
- [ ] Backup admin wallets are configured
- [ ] Contract deployed to correct network (testnet/mainnet)
- [ ] All tests passing before deployment
- [ ] Monitoring set up for admin wallet balances
- [ ] Rate limiting enabled on API endpoints
- [ ] Cron job authentication verified

## Troubleshooting

### "Insufficient funds" error
- Ensure user has enough smUSD
- Check house balance is sufficient for potential payouts

### "Not authorized" error
- Verify caller is an authorized admin
- Check admin wallet is funded with gas

### "Market not found" error
- Verify game_id matches exactly
- Check market was created successfully

### Transaction failed
- Check gas balance in admin wallet
- Verify all arguments are correct type and format
- Review transaction error message

## Upgrade Path

To upgrade contracts:

1. Deploy new version with different address
2. Migrate data if needed
3. Update frontend environment variables
4. Deprecate old contract

## Support

For issues:
- Check logs in Aptos Explorer
- Review error codes in README.md
- Consult API_INTEGRATION.md for API issues

## Next Steps

1. ✅ Deploy to testnet and test thoroughly
2. ✅ Integrate with frontend
3. ✅ Set up monitoring and alerts
4. ✅ Deploy to mainnet when ready
5. ✅ Monitor initial bets and settlements

