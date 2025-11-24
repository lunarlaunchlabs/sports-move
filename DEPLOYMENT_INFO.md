# Sports Betting Contracts - Deployment Information

## 🚀 Deployment Summary

**Network:** Movement Testnet  
**Deployment Date:** November 24, 2025  
**Status:** ✅ Successfully Deployed and Initialized

---

## 📦 Contract Addresses

### Main Contract Address
```
0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5
```

### Module Addresses

**smUSD Module:**
```
0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::smusd
```

**Sports Betting Module:**
```
0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::sports_betting
```

---

## 👥 Oracle Admin Addresses

Four admin wallets have been created and registered with admin capabilities:

### Admin 1
- **Address:** `0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841`
- **Private Key:** `0x56866fce3807b72ef906179b314375ac60a9ccb623894ec9f9613bf52e49c02f`
- **Status:** ✅ Registered & Funded
- **Role:** Primary oracle for market updates

### Admin 2 (Deployer)
- **Address:** `0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5`
- **Private Key:** `0xc3776a685c1a0d5060b7ce523c1c08a66409a7f1ebc8b0f836dc1c936046c692`
- **Status:** ✅ Registered & Funded
- **Role:** Contract deployer & backup oracle

### Admin 3
- **Address:** `0xf042656c9c2fc6a97c6a6c9b582324e882d3749de81d457458c5abea1506c404`
- **Private Key:** `0x1a9f7ad2881b46b1b5260d387294b2b170731d6d90ed9559f271be5e1e8131d9`
- **Status:** ✅ Registered & Funded
- **Role:** Backup oracle

### Admin 4
- **Address:** `0x1bfdf9b88ddaa696b74a08da4844f16b734f4007833dda3b9ff8548ab0f2d3da`
- **Private Key:** `0x4c877229f57d5e7deff8405e7a78e0ab81e906bc715502bc2e678e7d4bbc832b`
- **Status:** ✅ Registered & Funded
- **Role:** Backup oracle

---

## 🔗 Network Information

**Network:** Movement Testnet  
**RPC URL:** `https://testnet.movementnetwork.xyz/v1`  
**Faucet:** `https://faucet.testnet.movementnetwork.xyz/`  
**Explorer:** `https://explorer.movementnetwork.xyz/?network=custom`

---

## 📊 Deployment Transactions

### Contract Deployment
- **Transaction Hash:** `0xd65e42506b678355b3a6d2bcbc983d53f53d7902ab2259661c22d153a81b10d1`
- **Gas Used:** 6,187 Octas
- **Explorer:** [View Transaction](https://explorer.movementnetwork.xyz/txn/0xd65e42506b678355b3a6d2bcbc983d53f53d7902ab2259661c22d153a81b10d1?network=custom)

### Initialization Transactions

**smUSD Initialization:**
- **Transaction Hash:** `0xbffd2876589a2f4147b8dc43dd1a6b52279d61ca2c5e5ee764367025d7c89b84`
- **Status:** ✅ Success

**Sports Betting Initialization:**
- **Transaction Hash:** `0x78874024be2b089d3d1dfb4dfe174a739c05091c01df356e26af2cff624e1fb9`
- **Status:** ✅ Success

**House Funding:**
- **Transaction Hash:** `0xe8c6a7c230b37f381ab5f7b11b7e1c4018e54b5df6dbaa959198492ed133a0e9`
- **Amount:** 50,000 smUSD
- **Status:** ✅ Success

---

## 💰 Initial Funding

### House Balance
- **Current Balance:** 50,000.00 smUSD
- **Purpose:** Payout reserves for winning bets

### Admin Funding
All admin wallets have been funded with:
- **MOVE tokens:** ~1 MOVE (for gas)
- **smUSD:** Admin 1 has 50,000 smUSD for testing/operations

---

## 🔐 Security Notes

### Private Key Storage

⚠️ **CRITICAL SECURITY INFORMATION:**

All private keys are stored in the `.env` file which is **gitignored** and **never committed** to the repository.

**Environment Variables (.env):**
```bash
# Contract Addresses
CONTRACT_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5
SMUSD_MODULE_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::smusd
BETTING_MODULE_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::sports_betting

# Network
NODE_URL=https://testnet.movementnetwork.xyz/v1

# Deployer (Admin 2)
DEPLOYER_PRIVATE_KEY=0xc3776a685c1a0d5060b7ce523c1c08a66409a7f1ebc8b0f836dc1c936046c692
DEPLOYER_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5

# Oracle Admins
ADMIN1_PRIVATE_KEY=0x56866fce3807b72ef906179b314375ac60a9ccb623894ec9f9613bf52e49c02f
ADMIN1_ADDRESS=0x2f40b38f493a10a6d98f7e9555876bd812034df2197ecd33916adfe40bbd9841

ADMIN2_PRIVATE_KEY=0xc3776a685c1a0d5060b7ce523c1c08a66409a7f1ebc8b0f836dc1c936046c692
ADMIN2_ADDRESS=0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5

ADMIN3_PRIVATE_KEY=0x1a9f7ad2881b46b1b5260d387294b2b170731d6d90ed9559f271be5e1e8131d9
ADMIN3_ADDRESS=0xf042656c9c2fc6a97c6a6c9b582324e882d3749de81d457458c5abea1506c404

ADMIN4_PRIVATE_KEY=0x4c877229f57d5e7deff8405e7a78e0ab81e906bc715502bc2e678e7d4bbc832b
ADMIN4_ADDRESS=0x1bfdf9b88ddaa696b74a08da4844f16b734f4007833dda3b9ff8548ab0f2d3da
```

### Best Practices

1. **Never commit `.env` to git** - Already configured in `.gitignore`
2. **Rotate keys regularly** - Especially for production
3. **Use hardware wallets** - For mainnet deployment
4. **Limit key exposure** - Only share with authorized team members
5. **Monitor transactions** - Set up alerts for admin wallet activity

---

## 🎯 Contract Capabilities

### Admin Functions

All 4 admin addresses can perform:

**Market Management:**
- `create_market` - Create new betting markets
- `update_market` - Update market details and odds
- `update_market_odds` - Update only odds for existing markets
- `resolve_market` - Mark market as resolved with winning outcome
- `cancel_market` - Cancel market and trigger refunds

**Settlement:**
- `settle_bets` - Automatically payout winning bets
- `deposit_house_funds` - Add funds to house balance
- `withdraw_house_funds` - Remove funds from house balance

**Admin Management:**
- `add_admin` - Add new admin address (if needed)
- `remove_admin` - Remove admin address (if needed)

### Public Functions

**Betting:**
- `place_bet` - Users place bets on markets

**View Functions:**
- `get_all_markets` - Get all markets
- `get_market` - Get specific market details
- `get_user_bets` - Get all bets for a user
- `get_bets_for_market` - Get all bets for a market
- `get_house_balance` - View house balance
- `get_admins` - View all admin addresses

### smUSD Functions

**Admin:**
- `mint` - Mint smUSD to any address

**Public:**
- `register` - Register account to receive smUSD
- `transfer` - Transfer smUSD between accounts
- `balance_of` - View balance of any address

---

## 📝 Quick Reference

### Calling Contract Functions

**Example: Create Market (using Node.js)**
```javascript
const { AptosClient, AptosAccount, HexString } = require('aptos');

const client = new AptosClient('https://testnet.movementnetwork.xyz/v1');
const admin = new AptosAccount(new HexString(process.env.ADMIN1_PRIVATE_KEY).toUint8Array());

const payload = {
  type: 'entry_function_payload',
  function: '0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5::sports_betting::create_market',
  type_arguments: [],
  arguments: [
    'game_123',           // game_id
    'americanfootball_nfl', // sport_key
    'NFL',                // sport_title
    'Team A',             // home_team
    'Team B',             // away_team
    1732492800,           // commence_time (unix timestamp)
    150,                  // home_odds (e.g., +150)
    200,                  // away_odds (e.g., 200 for -200)
    false,                // home_odds_is_negative
    true                  // away_odds_is_negative
  ]
};

const txn = await client.generateTransaction(admin.address(), payload);
const signedTxn = await client.signTransaction(admin, txn);
const result = await client.submitTransaction(signedTxn);
await client.waitForTransaction(result.hash);
```

### Useful Commands

**Fund account from faucet:**
```bash
curl -X POST "https://faucet.testnet.movementnetwork.xyz/mint?amount=100000000&address=YOUR_ADDRESS"
```

**Check account balance:**
```bash
curl "https://testnet.movementnetwork.xyz/v1/accounts/YOUR_ADDRESS/resource/0x1::coin::CoinStore%3C0x1::aptos_coin::AptosCoin%3E"
```

**View deployed modules:**
```bash
curl "https://testnet.movementnetwork.xyz/v1/accounts/0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5/modules"
```

---

## 🔄 Next Steps

1. **✅ Contracts Deployed** - Complete
2. **✅ Admins Registered** - Complete  
3. **✅ House Funded** - Complete
4. **⏭️ Integrate with APIs** - Connect markets and scores endpoints
5. **⏭️ Set up Cron Jobs** - Automate market updates and settlements
6. **⏭️ Test End-to-End** - Full betting flow with real data

---

## 📚 Additional Documentation

- [Contract README](./move/README.md) - Detailed contract documentation
- [API Integration Guide](./move/API_INTEGRATION.md) - How to integrate with Next.js
- [Deployment Guide](./move/DEPLOYMENT.md) - Full deployment instructions
- [Movement Integration](./MOVEMENT_INTEGRATION.md) - Movement Network setup

---

## ⚠️ Important Reminders

1. **This is TESTNET** - All addresses and keys are for testnet only
2. **Private Keys** - Never share or commit private keys
3. **Backup Keys** - Store keys securely in multiple locations
4. **Monitor Balances** - Ensure admin wallets have sufficient gas
5. **Test Thoroughly** - Test all functions before mainnet deployment

---

## 📞 Support

For issues or questions:
- Check contract events in the [Movement Explorer](https://explorer.movementnetwork.xyz/?network=custom)
- Review transaction hashes for debugging
- Verify admin wallet balances regularly

---

**Last Updated:** November 24, 2025  
**Contract Version:** 1.0.0  
**Network:** Movement Testnet

