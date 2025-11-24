# Deployment Status

## ✅ Completed Steps

### 1. Oracle Admin Wallets Generated
**Status:** ✅ COMPLETE

All wallet addresses and private keys have been generated and stored securely.

**Deployer:**
- Address: `0xf9d36b91114e0220daede6b4b30eb59627654e8ad1a4b1f758c1a02c50b1c652`
- Role: Deploy contracts
- Status: ✅ Funded with 1 APT

**Admin 1 (Primary Oracle):**
- Address: `0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841`
- Role: Primary oracle for market creation/resolution
- Status: ✅ Funded with 1 APT

**Admin 2 (Backup Oracle):**
- Address: `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5`
- Role: Backup oracle #1
- Status: ✅ Funded with 1 APT

**Admin 3 (Backup Oracle):**
- Address: `0xf042656c9c2fc6a97c6a6c9b582324e882d3749de81d457458c5abea1506c404`
- Role: Backup oracle #2
- Status: ✅ Funded with 1 APT

**Admin 4 (Backup Oracle):**
- Address: `0x1bfdf9b88ddaa696b74a08da4844f16b734f4007833dda3b9ff8548ab0f2d3da`
- Role: Backup oracle #3
- Status: ✅ Funded with 1 APT

### 2. Wallet Storage
**Status:** ✅ COMPLETE

- `.env` file created with all credentials
- `config/admin-wallets.json` created for reference
- `.gitignore` updated to exclude private keys
- All wallets funded from devnet faucet

---

## ⏳ Next Steps (Requires Aptos CLI)

### 3. Install Aptos CLI

**macOS/Linux:**
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

**Verify installation:**
```bash
aptos --version
```

### 4. Deploy Contracts

**Run deployment script:**
```bash
node scripts/deploy-contracts.js
```

This will:
- Update `Move.toml` with deployer address
- Compile both contracts (smUSD + sports_betting)
- Publish to devnet blockchain
- Save contract addresses to `.env`

**Expected output:**
```
📝 Contract Address: 0xf9d36b91114e0220daede6b4b30eb59627654e8ad1a4b1f758c1a02c50b1c652
📝 smUSD Module: 0xf9d36b91...::smusd
📝 Betting Module: 0xf9d36b91...::sports_betting
```

### 5. Initialize Contracts

**Run initialization script:**
```bash
node scripts/initialize-contracts.js
```

This will:
1. Initialize smUSD stablecoin
2. Initialize sports betting contract with 4 admin addresses
3. Register all admins for smUSD
4. Mint 100,000 smUSD to Admin 1
5. Deposit 50,000 smUSD to house balance
6. Verify initialization

**Expected output:**
```
✅ smUSD contract initialized
✅ Sports betting contract initialized
✅ 4 admin oracles registered and authorized
✅ House funded with 50,000 smUSD
```

---

## 📋 Deployment Checklist

- [x] Generate admin wallet addresses
- [x] Store private keys securely in .env
- [x] Fund all wallets from faucet
- [ ] Install Aptos CLI
- [ ] Deploy contracts to blockchain
- [ ] Initialize smUSD contract
- [ ] Initialize betting contract with admins
- [ ] Register admins for smUSD
- [ ] Fund house balance
- [ ] Verify deployment
- [ ] Integrate with Next.js APIs
- [ ] Set up cron jobs for settlement

---

## 🔐 Security Notes

### Private Key Management

**Current Status:**
- ✅ Keys stored in `.env` file (git-ignored)
- ✅ Backup in `config/admin-wallets.json` (git-ignored)
- ⚠️  Keys are in plaintext on filesystem

**Production Recommendations:**
1. **Use Hardware Wallets:** For mainnet, use Ledger/Trezor for admin keys
2. **Key Management Service:** Consider AWS KMS, Google Cloud KMS, or HashiCorp Vault
3. **Environment Variables:** In production, use secret management (Vercel secrets, etc.)
4. **Access Control:** Limit who can access admin private keys
5. **Rotation:** Regularly rotate keys using `add_admin()` / `remove_admin()`

### Network Security

**Current Network:** Devnet (for testing)

**Before Mainnet:**
- [ ] Audit contracts
- [ ] Security review
- [ ] Load testing
- [ ] Disaster recovery plan
- [ ] Monitoring and alerting

---

## 📊 Current Configuration

### Network
- **Network:** Devnet
- **Node URL:** https://fullnode.devnet.aptoslabs.com/v1
- **Faucet URL:** https://faucet.devnet.aptoslabs.com

### Wallets Funded
- Deployer: 1 APT
- Admin 1: 1 APT
- Admin 2: 1 APT
- Admin 3: 1 APT
- Admin 4: 1 APT
- **Total:** 5 APT

### Contract Details (Will be filled after deployment)
- Contract Address: `TBD`
- smUSD Module: `TBD`
- Betting Module: `TBD`

---

## 🚀 Quick Commands

### Fund wallets (already done)
```bash
node scripts/fund-wallets.js
```

### Deploy contracts (requires Aptos CLI)
```bash
node scripts/deploy-contracts.js
```

### Initialize contracts
```bash
node scripts/initialize-contracts.js
```

### Test deployment
```bash
# Update test-sports-move-contracts.js with real contract address
node test-sports-move-contracts.js
```

---

## 📞 Troubleshooting

### "Aptos CLI not found"
Install Aptos CLI: `curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3`

### "Insufficient funds"
Fund wallets again: `node scripts/fund-wallets.js`

### "Module already exists"
Contracts already deployed. Check `.env` for `CONTRACT_ADDRESS`

### "Transaction failed"
Check wallet has gas. View error on explorer: https://explorer.aptoslabs.com/

---

## 📚 Documentation

- **Full Deployment Guide:** `/move/DEPLOYMENT.md`
- **API Integration:** `/move/API_INTEGRATION.md`
- **Usage Guide:** `/move/README.md`
- **Quick Start:** `/QUICK_START.md`

---

## ✅ Ready to Deploy!

All admin wallets are generated, funded, and ready. Run the deployment script when Aptos CLI is installed.

**Current Status:** 🟡 Wallets Ready - Awaiting Contract Deployment

