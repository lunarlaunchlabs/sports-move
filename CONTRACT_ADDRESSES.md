# Contract Addresses

## Movement Bardock Testnet (Current/Active)

| Field | Value |
|-------|-------|
| **Network** | Movement Bardock Testnet |
| **Chain ID** | 250 |
| **RPC URL** | https://testnet.movementnetwork.xyz/v1 |
| **Contract Address** | `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5` |
| **Deployment Tx** | `0x17c2b016908a8d73821c9f05accb8c6a6dd2e6d67c11a0bbf36c2d2043121457` |
| **Explorer** | [View Account](https://explorer.movementnetwork.xyz/account/0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5?network=bardock+testnet) |
| **Deployed** | December 5, 2025 |

### Modules

| Module | Full Address |
|--------|--------------|
| smusd | `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::smusd` |
| sports_betting | `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::sports_betting` |
| minimal_test | `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::minimal_test` |

---

## Movement Legacy Testnet (Deprecated)

| Field | Value |
|-------|-------|
| **Network** | Movement Testnet (Old) |
| **RPC URL** | https://testnet.movementnetwork.xyz/v1 |
| **Contract Address** | `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5` |
| **Status** | ⚠️ Deprecated - Not upgradeable due to bytecode incompatibility |

### Modules

| Module | Full Address |
|--------|--------------|
| smusd | `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::smusd` |
| sports_betting | `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::sports_betting` |

---

## Environment Variables

For the Bardock Testnet deployment, use these in your `.env`:

```bash
# Movement Bardock Testnet
CONTRACT_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5
SMUSD_MODULE_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::smusd
BETTING_MODULE_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::sports_betting
MOVEMENT_RPC_URL=https://testnet.movementnetwork.xyz/v1
```

---

## Notes

- Both deployments use the same account address but are on different networks
- The Bardock testnet deployment includes the updated `create_market` function that handles duplicate game_ids
- The legacy testnet deployment cannot be upgraded due to CLI/bytecode version incompatibility

