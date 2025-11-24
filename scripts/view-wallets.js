#!/usr/bin/env node

/**
 * View Oracle Admin Wallet Information
 * 
 * This script displays the admin wallet addresses and balances.
 */

require('dotenv').config();
const { AptosClient } = require('aptos');
const fs = require('fs');
const path = require('path');

const NODE_URL = process.env.NODE_URL || 'https://testnet.movementnetwork.xyz/v1';

async function viewWallets() {
  console.log('👀 Oracle Admin Wallet Information\n');

  const client = new AptosClient(NODE_URL);

  const wallets = [
    { name: 'Deployer', address: process.env.DEPLOYER_ADDRESS },
    { name: 'Admin 1 (Primary)', address: process.env.ADMIN1_ADDRESS },
    { name: 'Admin 2 (Backup)', address: process.env.ADMIN2_ADDRESS },
    { name: 'Admin 3 (Backup)', address: process.env.ADMIN3_ADDRESS },
    { name: 'Admin 4 (Backup)', address: process.env.ADMIN4_ADDRESS },
  ];

  console.log('📊 Wallet Addresses & Balances:\n');

  for (const wallet of wallets) {
    if (!wallet.address) {
      console.log(`⚠️  ${wallet.name}: Not configured`);
      continue;
    }

    try {
      const resources = await client.getAccountResources(wallet.address);
      const accountResource = resources.find(r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
      const balance = accountResource ? parseInt(accountResource.data.coin.value) / 100_000_000 : 0;

      console.log(`${wallet.name}:`);
      console.log(`  Address: ${wallet.address}`);
      console.log(`  Balance: ${balance.toFixed(4)} APT`);
      console.log('');
    } catch (error) {
      console.log(`${wallet.name}:`);
      console.log(`  Address: ${wallet.address}`);
      console.log(`  Balance: Account not found on chain`);
      console.log('');
    }
  }

  // Check if config file exists
  const configPath = path.join(__dirname, '..', 'config', 'admin-wallets.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('📋 Configuration File:');
    console.log(`  Generated: ${new Date(config.generated).toLocaleString()}`);
    console.log(`  Network: ${config.network}`);
    console.log(`  Total Admins: ${config.admins.length}\n`);
  }

  // Check contract status
  if (process.env.CONTRACT_ADDRESS) {
    console.log('📦 Contract Information:');
    console.log(`  Contract Address: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`  smUSD Module: ${process.env.CONTRACT_ADDRESS}::smusd`);
    console.log(`  Betting Module: ${process.env.CONTRACT_ADDRESS}::sports_betting\n`);

    try {
      // Check if contract is deployed
      const modules = await client.getAccountModules(process.env.CONTRACT_ADDRESS);
      const smusdModule = modules.find(m => m.abi.name === 'smusd');
      const bettingModule = modules.find(m => m.abi.name === 'sports_betting');

      console.log('  Contract Status:');
      console.log(`    smUSD: ${smusdModule ? '✅ Deployed' : '❌ Not deployed'}`);
      console.log(`    Sports Betting: ${bettingModule ? '✅ Deployed' : '❌ Not deployed'}\n`);
    } catch (error) {
      console.log('  Contract Status: ⏳ Not yet deployed\n');
    }
  } else {
    console.log('📦 Contract: ⏳ Not yet deployed\n');
  }

  console.log('💡 Commands:');
  console.log('  Fund wallets: node scripts/fund-wallets.js');
  console.log('  Deploy contracts: node scripts/deploy-contracts.js');
  console.log('  Initialize: node scripts/initialize-contracts.js');
}

viewWallets().catch(console.error);

