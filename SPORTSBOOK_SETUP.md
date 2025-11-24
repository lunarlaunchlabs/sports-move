# 🎰 Sportsbook Interface Setup Guide

## Quick Start

### 1. Create Environment File

Create `.env.local` in the project root:

```bash
# Frontend Environment Variables
NEXT_PUBLIC_NODE_URL=https://testnet.movementnetwork.xyz/v1
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5
```

### 2. Start the Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`

## Using the Sportsbook

### Connect Your Wallet

1. Click on the **Private Key** input field
2. Enter one of the admin private keys from your `.env` file:
   - `ADMIN1_PRIVATE_KEY`, `ADMIN2_PRIVATE_KEY`, etc.
3. Click **Connect Wallet**
4. Your address and smUSD balance will be displayed

**Example (ADMIN1):**
```
Private Key: 0x... (from your .env ADMIN1_PRIVATE_KEY)
```

### View Markets

1. Use the **Markets** filter dropdown to view:
   - **All Markets**: Every market on the blockchain
   - **Active**: Open markets accepting bets
   - **Resolved**: Completed markets with winners
   - **Cancelled**: Cancelled markets with refunds

2. Markets show:
   - Sport and teams
   - Game start time
   - American odds format (e.g., +200, -150)
   - Current status

### Place a Bet

1. **Connect your wallet** (required)
2. Click on a team's odds button in any active market
3. The betting slip will open on the right
4. Enter your bet amount in smUSD
5. Review the potential payout
6. Click **Place Bet**
7. Wait for blockchain confirmation
8. Your balance and bets will automatically update

### View Your Bets

1. After connecting your wallet, the **My Bets** section appears
2. Use the filter dropdown to view:
   - **All**: All your bets
   - **Active**: Unresolved bets
   - **Resolved**: Settled bets
   - **Cancelled**: Refunded bets

3. Each bet shows:
   - Selected team
   - Stake amount
   - Potential payout
   - Current odds
   - Settlement status

## Features

### Market Filters
- **All**: See everything
- **Active**: Markets open for betting
- **Resolved**: Completed markets (shows winner)
- **Cancelled**: Cancelled markets

### Bet Filters
- **All**: All your historical bets
- **Active**: Current open bets
- **Resolved**: Settled bets (won/lost)
- **Cancelled**: Refunded bets

### Automatic Updates
- Balance refreshes after each bet
- Bet list updates automatically
- Market data refreshes when filter changes

## Example Workflow

1. **Connect**: Enter ADMIN1 private key and connect
2. **Browse**: Filter markets to show "Active" only
3. **Select**: Click on "+200" for a team you like
4. **Bet**: Enter 100 smUSD
5. **Review**: See potential payout: 300 smUSD
6. **Confirm**: Click "Place Bet"
7. **Wait**: Transaction processes (~2 seconds)
8. **Done**: Balance decreases by 100, bet appears in "My Bets"

## Troubleshooting

### "Please connect your wallet first"
- You must connect a wallet before placing bets
- Use a valid private key from your `.env` file

### "Invalid private key"
- Ensure you're using a properly formatted hex private key
- Should start with `0x`
- Must be a valid Aptos/Movement private key

### "Failed to fetch balance"
- Check that `NEXT_PUBLIC_CONTRACT_ADDRESS` is set correctly
- Ensure you're connected to Movement testnet
- Verify the contract is deployed and initialized

### No markets showing
- Try changing the filter (some filters may be empty)
- Run `npm run test:api-integration` to populate markets
- Check that `/api/markets` was called at least once

### Bet placement fails
- Ensure you have enough smUSD balance
- Check that the market is still active (not resolved/cancelled)
- Verify your wallet has gas tokens (MOVE) for transaction fees

## Admin Wallets for Testing

Use these pre-funded wallets (from your `.env`):

- **ADMIN1**: Has 50,000 smUSD
- **ADMIN2**: Has smUSD (used for contract operations)  
- **ADMIN3**: Has smUSD
- **ADMIN4**: Has smUSD

## Next Steps

- [ ] Fund additional test users
- [ ] Add real-time price updates
- [ ] Implement live score tracking
- [ ] Add bet history export
- [ ] Mobile app version
- [ ] Multi-wallet support (Petra, Martian, etc.)

## Security Notes

⚠️ **This is a demo interface for testing purposes**

- Never share your private keys
- The private key input is for demo/testing only
- In production, use proper wallet adapters (Petra, Martian, etc.)
- `.env.local` is gitignored for security

## Support

For issues or questions:
1. Check the blockchain explorer for transaction status
2. Review `test-results/` for API test outputs
3. Check console logs in browser DevTools
4. Verify contract is deployed: Check `DEPLOYMENT_INFO.md`

---

**Enjoy betting on the blockchain! 🎲🏈**

