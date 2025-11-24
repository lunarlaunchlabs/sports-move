# 🎉 Oracle Admin Setup Complete!

## ✅ What Has Been Done

### 1. Oracle Admin Wallets Created & Funded

**4 Oracle Admin Addresses Generated:**

1. **Admin 1 (Primary Oracle)**
   - Address: `0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841`
   - Role: Primary oracle for market creation and resolution
   - Status: ✅ Funded with 1 APT

2. **Admin 2 (Backup Oracle 1)**
   - Address: `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5`
   - Role: Backup oracle for redundancy
   - Status: ✅ Funded with 1 APT

3. **Admin 3 (Backup Oracle 2)**
   - Address: `0xf042656c9c2fc6a97c6a6c9b582324e882d3749de81d457458c5abea1506c404`
   - Role: Backup oracle for redundancy
   - Status: ✅ Funded with 1 APT

4. **Admin 4 (Backup Oracle 3)**
   - Address: `0x1bfdf9b88ddaa696b74a08da4844f16b734f4007833dda3b9ff8548ab0f2d3da`
   - Role: Backup oracle for redundancy
   - Status: ✅ Funded with 1 APT

**Deployer Wallet:**
- Address: `0xf9d36b91114e0220daede6b4b30eb59627654e8ad1a4b1f758c1a02c50b1c652`
- Role: Deploy and own contracts
- Status: ✅ Funded with 1 APT

### 2. Secure Storage

**Private Keys Stored:**
- ✅ `.env` file (git-ignored)
- ✅ `config/admin-wallets.json` (git-ignored)
- ✅ `.gitignore` updated to protect sensitive files

**Security Measures:**
- ✅ All private keys excluded from git
- ✅ Backup configuration created
- ✅ Random CRON_SECRET generated

### 3. Deployment Scripts Created

**Available Scripts:**
- ✅ `scripts/generate-admin-wallets.js` - Generate wallets
- ✅ `scripts/fund-wallets.js` - Fund from faucet
- ✅ `scripts/deploy-contracts.js` - Deploy to blockchain
- ✅ `scripts/initialize-contracts.js` - Initialize with admins
- ✅ `scripts/view-wallets.js` - View status

### 4. Documentation

**Created:**
- ✅ `DEPLOYMENT_STATUS.md` - Current deployment status
- ✅ `scripts/README.md` - Script documentation
- ✅ `.env.example` - Example environment file

---

## 📋 Current Status

**Oracle Wallets:** ✅ READY
**Funds:** ✅ ALL FUNDED
**Contracts:** ⏳ AWAITING DEPLOYMENT
**Initialization:** ⏳ PENDING

---

## 🚀 Next Steps to Complete Deployment

### Step 1: Install Aptos CLI

```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

Verify installation:
```bash
aptos --version
```

### Step 2: Deploy Contracts

```bash
node scripts/deploy-contracts.js
```

This will:
- Compile both smart contracts
- Deploy to devnet
- Save contract address to `.env`

**Expected Duration:** 1-2 minutes

### Step 3: Initialize Contracts

```bash
node scripts/initialize-contracts.js
```

This will:
- Initialize smUSD stablecoin
- Register all 4 admin oracles with the contract
- Give admin capabilities to all oracle addresses
- Mint initial smUSD
- Fund house balance with 50,000 smUSD

**Expected Duration:** 30-60 seconds

### Step 4: Verify Deployment

```bash
node scripts/view-wallets.js
```

Should show:
- ✅ All wallet balances
- ✅ Contract deployed
- ✅ Admins registered

---

## 🔑 Oracle Admin Capabilities

Once initialized, all 4 admin addresses will have these permissions:

### Market Operations
- ✅ `create_market()` - Add new betting markets
- ✅ `update_market()` - Update market details
- ✅ `resolve_market()` - Set game outcome
- ✅ `cancel_market()` - Cancel postponed games

### Bet Settlement
- ✅ `settle_bets()` - Automatically settle all bets for a market
  - Pays winners (with 5% house fee)
  - Marks losers as settled
  - Updates house balance

### House Management
- ✅ `deposit_house_funds()` - Add smUSD to house balance

---

## 🔐 Security Best Practices

### Current Setup (Devnet)
- Private keys in `.env` file
- Git-ignored for safety
- 4 oracles for redundancy

### For Production (Mainnet)

1. **Key Management**
   - Use hardware wallets (Ledger/Trezor)
   - Or use key management service (AWS KMS, etc.)
   - Never commit private keys

2. **Access Control**
   - Limit who can access oracle keys
   - Use separate keys for different environments
   - Implement key rotation schedule

3. **Monitoring**
   - Set up alerts for admin transactions
   - Monitor house balance
   - Track gas usage

4. **Backup**
   - Keep secure offline backup of all keys
   - Document recovery procedures
   - Test failover to backup oracles

---

## 💡 Using the Oracle Admins

### Primary Oracle (Admin 1)

**Use for:**
- Daily market creation from API
- Resolving games via cron job
- Settling bets automatically

**Integration:**
```javascript
// In your API routes
const admin1 = new AptosAccount(
  new HexString(process.env.ADMIN1_PRIVATE_KEY).toUint8Array()
);

// Create market
await createMarket(admin1, gameData);

// Resolve and settle
await resolveMarket(admin1, gameId, winner);
await settleBets(admin1, gameId);
```

### Backup Oracles (Admin 2-4)

**Use for:**
- Key rotation
- Failover if primary compromised
- Load balancing (optional)
- Emergency operations

**Switch to backup:**
```javascript
// Use Admin 2 instead of Admin 1
const admin2 = new AptosAccount(
  new HexString(process.env.ADMIN2_PRIVATE_KEY).toUint8Array()
);
```

---

## 📊 Admin Wallet Information

### View Anytime
```bash
node scripts/view-wallets.js
```

### Fund More Gas
```bash
node scripts/fund-wallets.js
```

### Check on Explorer
- Devnet Explorer: https://explorer.aptoslabs.com/?network=devnet
- Search for any admin address to see transactions

---

## 🎯 What's Next

After deployment, you'll be able to:

1. **Create Markets**
   - Sync from The Odds API
   - Admin 1 creates markets on-chain

2. **Place Bets**
   - Users bet via frontend
   - Funds escrowed in contract

3. **Resolve Games**
   - Fetch scores from API
   - Admin 1 resolves markets

4. **Settle Bets**
   - Admin 1 settles all bets
   - Winners receive payouts automatically
   - No user claim needed!

5. **Handle Cancellations**
   - Admin 1 cancels games
   - Full refunds processed automatically

---

## 📝 Quick Reference

### Wallet Addresses

```
Deployer:  0xf9d36b91114e0220daede6b4b30eb59627654e8ad1a4b1f758c1a02c50b1c652
Admin 1:   0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841
Admin 2:   0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5
Admin 3:   0xf042656c9c2fc6a97c6a6c9b582324e882d3749de81d457458c5abea1506c404
Admin 4:   0x1bfdf9b88ddaa696b74a08da4844f16b734f4007833dda3b9ff8548ab0f2d3da
```

### Commands

```bash
# Deploy contracts (requires Aptos CLI)
node scripts/deploy-contracts.js

# Initialize contracts
node scripts/initialize-contracts.js

# View status
node scripts/view-wallets.js

# Fund wallets
node scripts/fund-wallets.js
```

### Files

- Private keys: `.env`
- Wallet backup: `config/admin-wallets.json`
- Deployment status: `DEPLOYMENT_STATUS.md`
- Script docs: `scripts/README.md`

---

## ✅ Checklist

- [x] Generate oracle admin wallets
- [x] Fund all wallets from faucet
- [x] Store private keys securely
- [x] Create deployment scripts
- [ ] Install Aptos CLI
- [ ] Deploy contracts to blockchain
- [ ] Initialize contracts with admin addresses
- [ ] Register oracles with admin capabilities
- [ ] Verify admin permissions
- [ ] Integrate with APIs
- [ ] Set up cron jobs

---

## 🎉 Summary

**Oracle admin wallets are ready!**

All 4 oracle addresses have been generated, funded, and stored securely. They're ready to be registered with the sports betting contract as soon as it's deployed.

**Next:** Install Aptos CLI and run the deployment script.

