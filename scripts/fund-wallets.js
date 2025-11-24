#!/usr/bin/env node

/**
 * Fund Admin Wallets from Faucet
 * 
 * This script funds all admin wallets and the deployer from the devnet faucet.
 */

require('dotenv').config();
const { AptosClient, AptosAccount, FaucetClient } = require('aptos');

const NODE_URL = process.env.NODE_URL || 'https://fullnode.devnet.aptoslabs.com/v1';
const FAUCET_URL = process.env.FAUCET_URL || 'https://faucet.devnet.aptoslabs.com';

async function fundWallets() {
  console.log('💰 Funding Admin Wallets from Faucet...\n');

  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  const wallets = [
    { name: 'Deployer', key: process.env.DEPLOYER_PRIVATE_KEY, address: process.env.DEPLOYER_ADDRESS },
    { name: 'Admin 1', key: process.env.ADMIN1_PRIVATE_KEY, address: process.env.ADMIN1_ADDRESS },
    { name: 'Admin 2', key: process.env.ADMIN2_PRIVATE_KEY, address: process.env.ADMIN2_ADDRESS },
    { name: 'Admin 3', key: process.env.ADMIN3_PRIVATE_KEY, address: process.env.ADMIN3_ADDRESS },
    { name: 'Admin 4', key: process.env.ADMIN4_PRIVATE_KEY, address: process.env.ADMIN4_ADDRESS },
  ];

  for (const wallet of wallets) {
    if (!wallet.key || !wallet.address) {
      console.log(`⚠️  Skipping ${wallet.name} - not configured`);
      continue;
    }

    try {
      console.log(`Funding ${wallet.name} (${wallet.address.substring(0, 10)}...)...`);
      
      // Fund with 1 APT (100,000,000 octas)
      await faucetClient.fundAccount(wallet.address, 100_000_000);
      
      console.log(`✅ ${wallet.name} funded successfully`);
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to fund ${wallet.name}: ${error.message}`);
    }
  }

  console.log('\n✅ All wallets funded!');
  console.log('\n📝 Next Step: Deploy contracts with: node scripts/deploy-contracts.js');
}

fundWallets().catch(console.error);

