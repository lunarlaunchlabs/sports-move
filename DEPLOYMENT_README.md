# Sports Betting Contract Deployment Guide

## Overview

This guide documents the successful deployment of the updated Sports Betting contract to the **Movement Bardock Testnet**.

### Contract Update Summary

The `create_market` function was updated to:
- Check if a market with the same `game_id` already exists
- If found and not resolved/cancelled: update only the odds fields (`home_odds`, `home_odds_positive`, `away_odds`, `away_odds_positive`, `odds_last_update`)
- If found and resolved/cancelled: silently ignore the request
- If not found: create a new market as before

---

## Prerequisites

### 1. Install Movement CLI (Testnet Version with Move 2 Support)

**For macOS ARM64 (M-series chips):**
```bash
curl -LO https://github.com/movementlabsxyz/homebrew-movement-cli/releases/download/bypass-homebrew/movement-move2-testnet-macos-arm64.tar.gz && \
mkdir -p temp_extract && \
tar -xzf movement-move2-testnet-macos-arm64.tar.gz -C temp_extract && \
chmod +x temp_extract/movement && \
sudo mv temp_extract/movement /usr/local/bin/movement && \
rm -rf temp_extract movement-move2-testnet-macos-arm64.tar.gz
```

**For macOS Intel (x86_64):**
```bash
curl -LO https://github.com/movementlabsxyz/homebrew-movement-cli/releases/download/bypass-homebrew/movement-move2-testnet-macos-x86_64.tar.gz && \
mkdir -p temp_extract && \
tar -xzf movement-move2-testnet-macos-x86_64.tar.gz -C temp_extract && \
chmod +x temp_extract/movement && \
sudo mv temp_extract/movement /usr/local/bin/movement && \
rm -rf temp_extract movement-move2-testnet-macos-x86_64.tar.gz
```

**For Linux x86_64:**
```bash
curl -LO https://github.com/movementlabsxyz/homebrew-movement-cli/releases/download/bypass-homebrew/movement-move2-testnet-linux-x86_64.tar.gz && \
mkdir -p temp_extract && \
tar -xzf movement-move2-testnet-linux-x86_64.tar.gz -C temp_extract && \
chmod +x temp_extract/movement && \
sudo mv temp_extract/movement /usr/local/bin/movement && \
rm -rf temp_extract movement-move2-testnet-linux-x86_64.tar.gz
```

**Verify installation:**
```bash
movement --version
# Should output: movement 7.4.0
```

---

## Deployment Steps

### Step 1: Initialize CLI for Movement Bardock Testnet

```bash
cd move
movement init --network custom \
  --rest-url https://testnet.movementnetwork.xyz/v1 \
  --faucet-url https://faucet.testnet.movementnetwork.xyz/ \
  --assume-yes
```

This will:
- Generate a new keypair (or use existing one)
- Fund the account with testnet MOVE tokens automatically

### Step 2: Configure Move.toml

Update `move/Move.toml` with:

```toml
[package]
name = "SportsBetting"
version = "1.0.0"
authors = []

[addresses]
sports_betting = "YOUR_ACCOUNT_ADDRESS"

[dev-addresses]

[dependencies.AptosFramework]
git = "https://github.com/movementlabsxyz/aptos-core.git"
rev = "main"
subdir = "aptos-move/framework/aptos-framework"

[dev-dependencies]
```

**Important:** Use the Movement Labs fork (`movementlabsxyz/aptos-core`) with `rev = "main"`, not the upstream Aptos repo.

### Step 3: Deploy the Contract

```bash
cd move
rm -rf build  # Clean previous builds
movement move publish --assume-yes --max-gas 200000 --gas-unit-price 100
```

---

## Successful Deployment Details

| Field | Value |
|-------|-------|
| **Network** | Movement Bardock Testnet |
| **RPC URL** | https://testnet.movementnetwork.xyz/v1 |
| **Contract Address** | `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5` |
| **Transaction Hash** | `0x17c2b016908a8d73821c9f05accb8c6a6dd2e6d67c11a0bbf36c2d2043121457` |
| **Explorer** | [View Transaction](https://explorer.movementnetwork.xyz/txn/0x17c2b016908a8d73821c9f05accb8c6a6dd2e6d67c11a0bbf36c2d2043121457?network=custom) |
| **Gas Used** | 4,838 units |
| **Status** | ✅ Executed successfully |

### Deployed Modules

1. **smusd** - smUSD stablecoin module
2. **sports_betting** - Sports betting contract
3. **minimal_test** - Test module

---

## Movement Bardock Testnet Endpoints

| Service | URL |
|---------|-----|
| RPC | https://testnet.movementnetwork.xyz/v1 |
| Faucet Endpoint | https://faucet.testnet.movementnetwork.xyz/ |
| Faucet UI | https://faucet.movementnetwork.xyz/ |
| Explorer | https://explorer.movementnetwork.xyz/?network=bardock+testnet |
| Chain ID | 250 |

---

## Key Learnings

1. **Use the correct CLI version**: The Movement testnet requires the Move 2 testnet CLI (`movement 7.4.0`), not the mainnet CLI or standard Aptos CLI.

2. **Use Movement Labs framework**: The `Move.toml` must reference `movementlabsxyz/aptos-core` (not `aptos-labs/aptos-core`) to ensure bytecode compatibility.

3. **Fresh account for fresh deployment**: If deployment fails partway, use a fresh account address to avoid "cannot delete module" errors from partial deployments.

---

## References

- [Movement CLI Installation](https://docs.movementnetwork.xyz/devs/movementcli)
- [Movement First Contract Tutorial](https://docs.movementnetwork.xyz/devs/firstMoveContract)
- [Movement Network Endpoints](https://docs.movementnetwork.xyz/devs/networkEndpoints)

