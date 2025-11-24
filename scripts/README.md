# Deployment Scripts

Automated scripts for deploying and managing the sports betting smart contracts.

## 🚀 Quick Start

### 1. Generate Admin Wallets
```bash
node scripts/generate-admin-wallets.js
```

Creates 4 oracle admin wallets + 1 deployer wallet. Saves credentials to:
- `.env` - Environment variables
- `config/admin-wallets.json` - Wallet information

### 2. Fund Wallets
```bash
node scripts/fund-wallets.js
```

Funds all wallets from the devnet faucet (1 APT each).

### 3. Deploy Contracts
```bash
node scripts/deploy-contracts.js
```

**Requires:** Aptos CLI installed

Compiles and deploys both contracts (smUSD + sports_betting) to the blockchain.

### 4. Initialize Contracts
```bash
node scripts/initialize-contracts.js
```

Initializes both contracts:
- Registers admins with contract
- Mints initial smUSD
- Funds house balance

### 5. View Wallet Info
```bash
node scripts/view-wallets.js
```

Displays wallet addresses, balances, and deployment status.

---

## 📁 Scripts Overview

### generate-admin-wallets.js
**Purpose:** Generate oracle admin wallet addresses

**What it does:**
- Creates 5 new Aptos accounts (deployer + 4 admins)
- Generates private keys
- Saves to `.env` and `config/admin-wallets.json`
- Creates random CRON_SECRET

**Output:**
- `.env` file with all credentials
- `config/admin-wallets.json` with wallet details

**Run when:** First time setup

---

### fund-wallets.js
**Purpose:** Fund all wallets from faucet

**What it does:**
- Reads wallet addresses from `.env`
- Requests 1 APT from devnet faucet for each wallet
- Waits for transactions to complete

**Requirements:**
- `.env` file must exist
- Network must be devnet

**Run when:** After generating wallets, or when wallets need more gas

---

### deploy-contracts.js
**Purpose:** Deploy contracts to blockchain

**What it does:**
- Updates `Move.toml` with deployer address
- Compiles Move contracts
- Publishes to blockchain
- Saves contract address to `.env`

**Requirements:**
- Aptos CLI installed
- Deployer wallet funded
- `.env` file configured

**Run when:** After funding wallets

**Install Aptos CLI:**
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

---

### initialize-contracts.js
**Purpose:** Initialize deployed contracts

**What it does:**
1. Initialize smUSD stablecoin
2. Initialize sports betting contract with admin addresses
3. Register all admins for smUSD
4. Mint 100,000 smUSD to Admin 1
5. Deposit 50,000 smUSD to house balance
6. Verify initialization

**Requirements:**
- Contracts must be deployed
- Admin wallets must be funded

**Run when:** After deploying contracts

---

### view-wallets.js
**Purpose:** View wallet and deployment status

**What it does:**
- Displays all wallet addresses
- Shows current APT balances
- Shows contract deployment status
- Lists available commands

**Requirements:**
- `.env` file must exist

**Run when:** Anytime you want to check status

---

## 🔄 Complete Deployment Flow

```bash
# Step 1: Generate wallets
node scripts/generate-admin-wallets.js

# Step 2: Fund wallets
node scripts/fund-wallets.js

# Step 3: Install Aptos CLI (if not installed)
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Step 4: Deploy contracts
node scripts/deploy-contracts.js

# Step 5: Initialize contracts
node scripts/initialize-contracts.js

# Step 6: Verify deployment
node scripts/view-wallets.js
```

---

## 🔐 Environment Variables

After running `generate-admin-wallets.js`, your `.env` will contain:

```env
# Network
NETWORK=devnet
NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
FAUCET_URL=https://faucet.devnet.aptoslabs.com

# Deployer
DEPLOYER_PRIVATE_KEY=0x...
DEPLOYER_ADDRESS=0x...

# Admin Oracles
ADMIN1_PRIVATE_KEY=0x...
ADMIN1_ADDRESS=0x...

ADMIN2_PRIVATE_KEY=0x...
ADMIN2_ADDRESS=0x...

ADMIN3_PRIVATE_KEY=0x...
ADMIN3_ADDRESS=0x...

ADMIN4_PRIVATE_KEY=0x...
ADMIN4_ADDRESS=0x...

# Contract (filled after deployment)
CONTRACT_ADDRESS=0x...
SMUSD_MODULE_ADDRESS=0x...::smusd
BETTING_MODULE_ADDRESS=0x...::sports_betting

# Security
CRON_SECRET=...
```

---

## 📊 Wallet Roles

### Deployer
- **Purpose:** Deploy and own contracts
- **Permissions:** Full contract control
- **Used for:** Initial deployment only

### Admin 1 (Primary Oracle)
- **Purpose:** Main oracle for day-to-day operations
- **Permissions:** Create/resolve markets, settle bets
- **Used for:** Primary API integration, cron jobs

### Admin 2-4 (Backup Oracles)
- **Purpose:** Redundancy and failover
- **Permissions:** Same as Admin 1
- **Used for:** If primary admin key is lost or compromised

---

## ⚠️ Security Considerations

### Private Key Storage

**Current:** Keys stored in `.env` file (git-ignored)

**For Production:**
1. Use environment variables in hosting platform (Vercel, AWS, etc.)
2. Consider hardware wallets (Ledger/Trezor)
3. Use key management services (AWS KMS, Google Cloud KMS)
4. Implement key rotation

### Network Security

**Devnet:** Use for testing only
**Mainnet:** Requires:
- Security audit
- Penetration testing
- Multi-sig for critical operations
- Monitoring and alerting

---

## 🐛 Troubleshooting

### "Aptos CLI not found"
```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Verify installation
aptos --version
```

### "Module already exists"
Contracts already deployed. Check `.env` for `CONTRACT_ADDRESS`.

### "Insufficient funds"
Fund wallets again:
```bash
node scripts/fund-wallets.js
```

### "Transaction failed"
1. Check wallet has gas
2. View error on explorer: https://explorer.aptoslabs.com/
3. Wait a few seconds and retry

### "Cannot find module 'dotenv'"
Install dependencies:
```bash
npm install
```

---

## 📚 Related Documentation

- **Deployment Guide:** `/move/DEPLOYMENT.md`
- **API Integration:** `/move/API_INTEGRATION.md`
- **Usage Guide:** `/move/README.md`
- **Deployment Status:** `/DEPLOYMENT_STATUS.md`

---

## ✅ Checklist

- [ ] Generated admin wallets
- [ ] Funded all wallets
- [ ] Installed Aptos CLI
- [ ] Deployed contracts
- [ ] Initialized contracts
- [ ] Verified deployment
- [ ] Integrated with APIs
- [ ] Set up cron jobs

