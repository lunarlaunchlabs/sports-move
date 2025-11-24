#!/usr/bin/env node

/**
 * Generate Oracle Admin Wallet Addresses
 * 
 * This script generates 4 admin wallet addresses for the sports betting contract.
 * These will be the authorized oracle addresses that can:
 * - Create markets
 * - Resolve markets
 * - Settle bets
 * - Cancel markets
 */

const { AptosAccount } = require('aptos');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating Oracle Admin Wallets...\n');

// Generate 4 admin accounts + 1 deployer
const deployer = new AptosAccount();
const admin1 = new AptosAccount();
const admin2 = new AptosAccount();
const admin3 = new AptosAccount();
const admin4 = new AptosAccount();

const accounts = [
  { name: 'Deployer', account: deployer },
  { name: 'Admin 1 (Primary)', account: admin1 },
  { name: 'Admin 2 (Backup)', account: admin2 },
  { name: 'Admin 3 (Backup)', account: admin3 },
  { name: 'Admin 4 (Backup)', account: admin4 },
];

// Display generated accounts
accounts.forEach(({ name, account }) => {
  console.log(`${name}:`);
  console.log(`  Address: ${account.address().hex()}`);
  console.log(`  Private Key: 0x${Buffer.from(account.signingKey.secretKey).toString('hex').slice(0, 64)}`);
  console.log('');
});

// Create .env file content
const envContent = `# Sports Betting Contract Configuration
# Generated on ${new Date().toISOString()}

# Network Configuration
NETWORK=devnet
NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
FAUCET_URL=https://faucet.devnet.aptoslabs.com

# Contract Addresses (will be filled after deployment)
CONTRACT_ADDRESS=
SMUSD_MODULE_ADDRESS=
BETTING_MODULE_ADDRESS=

# Deployer Wallet
DEPLOYER_PRIVATE_KEY=0x${Buffer.from(deployer.signingKey.secretKey).toString('hex').slice(0, 64)}
DEPLOYER_ADDRESS=${deployer.address().hex()}

# Oracle Admin Wallets (4 for redundancy)
ADMIN1_PRIVATE_KEY=0x${Buffer.from(admin1.signingKey.secretKey).toString('hex').slice(0, 64)}
ADMIN1_ADDRESS=${admin1.address().hex()}

ADMIN2_PRIVATE_KEY=0x${Buffer.from(admin2.signingKey.secretKey).toString('hex').slice(0, 64)}
ADMIN2_ADDRESS=${admin2.address().hex()}

ADMIN3_PRIVATE_KEY=0x${Buffer.from(admin3.signingKey.secretKey).toString('hex').slice(0, 64)}
ADMIN3_ADDRESS=${admin3.address().hex()}

ADMIN4_PRIVATE_KEY=0x${Buffer.from(admin4.signingKey.secretKey).toString('hex').slice(0, 64)}
ADMIN4_ADDRESS=${admin4.address().hex()}

# Cron Job Secret (generate a random secret)
CRON_SECRET=${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}

# The Odds API (add your API key)
ODDS_API_KEY=
`;

// Write to .env file
const envPath = path.join(__dirname, '..', '.env');
fs.writeFileSync(envPath, envContent);

console.log('✅ .env file created with wallet addresses');
console.log(`📁 Location: ${envPath}\n`);

// Create admin-wallets.json for easy reference
const walletsData = {
  generated: new Date().toISOString(),
  network: 'devnet',
  deployer: {
    address: deployer.address().hex(),
    privateKey: `0x${Buffer.from(deployer.signingKey.secretKey).toString('hex').slice(0, 64)}`,
  },
  admins: [
    {
      id: 1,
      role: 'Primary Oracle',
      address: admin1.address().hex(),
      privateKey: `0x${Buffer.from(admin1.signingKey.secretKey).toString('hex').slice(0, 64)}`,
    },
    {
      id: 2,
      role: 'Backup Oracle 1',
      address: admin2.address().hex(),
      privateKey: `0x${Buffer.from(admin2.signingKey.secretKey).toString('hex').slice(0, 64)}`,
    },
    {
      id: 3,
      role: 'Backup Oracle 2',
      address: admin3.address().hex(),
      privateKey: `0x${Buffer.from(admin3.signingKey.secretKey).toString('hex').slice(0, 64)}`,
    },
    {
      id: 4,
      role: 'Backup Oracle 3',
      address: admin4.address().hex(),
      privateKey: `0x${Buffer.from(admin4.signingKey.secretKey).toString('hex').slice(0, 64)}`,
    },
  ],
};

const walletsPath = path.join(__dirname, '..', 'config', 'admin-wallets.json');
fs.mkdirSync(path.dirname(walletsPath), { recursive: true });
fs.writeFileSync(walletsPath, JSON.stringify(walletsData, null, 2));

console.log('✅ Admin wallets saved to config/admin-wallets.json\n');

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Keep .env file secure and NEVER commit to git');
console.log('2. Add .env to .gitignore');
console.log('3. Backup private keys in a secure location');
console.log('4. For production, use hardware wallets or key management services\n');

console.log('📝 Next Steps:');
console.log('1. Fund all accounts from faucet: node scripts/fund-wallets.js');
console.log('2. Deploy contracts: node scripts/deploy-contracts.js');
console.log('3. Initialize contracts: node scripts/initialize-contracts.js');

