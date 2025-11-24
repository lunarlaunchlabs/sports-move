#!/usr/bin/env node

/**
 * Deploy Sports Betting Contracts
 * 
 * This script deploys both the smUSD and sports_betting contracts to the blockchain.
 * Requires Aptos CLI to be installed.
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Sports Betting Contracts...\n');

// Check if Aptos CLI is installed
try {
  execSync('aptos --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Aptos CLI not found!');
  console.error('Install with: curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3');
  process.exit(1);
}

const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!DEPLOYER_ADDRESS || !DEPLOYER_PRIVATE_KEY) {
  console.error('❌ Deployer credentials not found in .env');
  console.error('Run: node scripts/generate-admin-wallets.js');
  process.exit(1);
}

console.log(`📝 Deployer Address: ${DEPLOYER_ADDRESS}\n`);

// Update Move.toml with deployer address
console.log('📝 Updating Move.toml...');
const moveTomlPath = path.join(__dirname, '..', 'move', 'Move.toml');
let moveToml = fs.readFileSync(moveTomlPath, 'utf8');
moveToml = moveToml.replace(
  /sports_betting = ".+"/,
  `sports_betting = "${DEPLOYER_ADDRESS}"`
);
fs.writeFileSync(moveTomlPath, moveToml);
console.log('✅ Move.toml updated\n');

// Compile contracts
console.log('🔨 Compiling contracts...');
try {
  execSync('cd move && aptos move compile', { stdio: 'inherit' });
  console.log('✅ Contracts compiled\n');
} catch (error) {
  console.error('❌ Compilation failed');
  process.exit(1);
}

// Deploy contracts
console.log('📦 Publishing contracts to blockchain...');
console.log('(This may take a minute...)\n');

try {
  const deployCmd = `cd move && aptos move publish \
    --private-key ${DEPLOYER_PRIVATE_KEY} \
    --named-addresses sports_betting=${DEPLOYER_ADDRESS} \
    --assume-yes`;
  
  execSync(deployCmd, { stdio: 'inherit' });
  
  console.log('\n✅ Contracts deployed successfully!');
  
  // Update .env with contract address
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /CONTRACT_ADDRESS=.*/,
    `CONTRACT_ADDRESS=${DEPLOYER_ADDRESS}`
  );
  envContent = envContent.replace(
    /SMUSD_MODULE_ADDRESS=.*/,
    `SMUSD_MODULE_ADDRESS=${DEPLOYER_ADDRESS}::smusd`
  );
  envContent = envContent.replace(
    /BETTING_MODULE_ADDRESS=.*/,
    `BETTING_MODULE_ADDRESS=${DEPLOYER_ADDRESS}::sports_betting`
  );
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Contract addresses saved to .env');
  console.log(`\n📝 Contract Address: ${DEPLOYER_ADDRESS}`);
  console.log(`📝 smUSD Module: ${DEPLOYER_ADDRESS}::smusd`);
  console.log(`📝 Betting Module: ${DEPLOYER_ADDRESS}::sports_betting`);
  
  console.log('\n📝 Next Step: Initialize contracts with: node scripts/initialize-contracts.js');
} catch (error) {
  console.error('\n❌ Deployment failed');
  console.error('Check that your deployer wallet has sufficient funds');
  process.exit(1);
}

