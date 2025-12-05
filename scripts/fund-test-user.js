#!/usr/bin/env node

/**
 * Fund Test User Wallet
 * 
 * This script registers and funds a test user wallet with smUSD.
 * For MOVE gas, use the faucet: https://faucet.movementnetwork.xyz/
 */

require('dotenv').config();
const { AptosClient, AptosAccount, HexString } = require('aptos');

// Configuration
const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5';

// Test user to fund
const TEST_USER_ADDRESS = '0x17ac475505b5828fdd8f42e3f5d9deb3b100b11e3d69532809d55db0ce4dbb61';

// Amount to mint: 1,000,000 smUSD (8 decimals)
const SMUSD_AMOUNT = 1_000_000 * 100_000_000; // 100,000,000,000,000

// Admin private key (from .env or hardcoded for now)
const ADMIN_PRIVATE_KEY = process.env.ADMIN1_PRIVATE_KEY || '0x56866fce3807b72ef906179b314375ac60a9ccb623894ec9f9613bf52e49c02f';

async function fundTestUser() {
  console.log('💰 Funding Test User Wallet...\n');
  console.log(`User Address: ${TEST_USER_ADDRESS}`);
  console.log(`Amount: 1,000,000 smUSD\n`);

  const client = new AptosClient(NODE_URL);
  const admin = new AptosAccount(new HexString(ADMIN_PRIVATE_KEY).toUint8Array());

  console.log(`Admin Address: ${admin.address().hex()}\n`);

  // Step 1: Check if user is registered for smUSD
  console.log('📝 Step 1: Checking if user is registered for smUSD...');
  
  try {
    const isRegistered = await client.view({
      function: `${CONTRACT_ADDRESS}::smusd::is_registered`,
      type_arguments: [],
      arguments: [TEST_USER_ADDRESS]
    });
    
    if (!isRegistered[0]) {
      console.log('   User not registered. Registration required by user themselves.');
      console.log('   ⚠️  User must call register() from their own wallet first!\n');
      console.log('   The user can do this by interacting with the contract or we can');
      console.log('   skip registration check and try minting directly.\n');
    } else {
      console.log('   ✅ User already registered for smUSD\n');
    }
  } catch (error) {
    console.log(`   ⚠️  Could not check registration: ${error.message}\n`);
  }

  // Step 2: Check current balance
  console.log('📊 Step 2: Checking current smUSD balance...');
  
  try {
    const balance = await client.view({
      function: `${CONTRACT_ADDRESS}::smusd::balance_of`,
      type_arguments: [],
      arguments: [TEST_USER_ADDRESS]
    });
    console.log(`   Current balance: ${(Number(balance[0]) / 100_000_000).toLocaleString()} smUSD\n`);
  } catch (error) {
    console.log(`   No balance yet (user may need to register first)\n`);
  }

  // Step 3: Mint smUSD to user
  console.log('🪙 Step 3: Minting 1,000,000 smUSD to user...');
  
  try {
    const mintPayload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::smusd::mint`,
      type_arguments: [],
      arguments: [TEST_USER_ADDRESS, SMUSD_AMOUNT.toString()]
    };

    const txn = await client.generateTransaction(admin.address(), mintPayload);
    const signedTxn = await client.signTransaction(admin, txn);
    const result = await client.submitTransaction(signedTxn);
    
    console.log(`   Transaction submitted: ${result.hash}`);
    console.log('   Waiting for confirmation...');
    
    await client.waitForTransaction(result.hash, { checkSuccess: true });
    
    console.log('   ✅ Minting successful!\n');

    // Verify new balance
    const newBalance = await client.view({
      function: `${CONTRACT_ADDRESS}::smusd::balance_of`,
      type_arguments: [],
      arguments: [TEST_USER_ADDRESS]
    });
    console.log(`   New balance: ${(Number(newBalance[0]) / 100_000_000).toLocaleString()} smUSD\n`);

  } catch (error) {
    console.error(`   ❌ Minting failed: ${error.message}`);
    
    if (error.message.includes('ECOIN_STORE_NOT_PUBLISHED')) {
      console.log('\n   ⚠️  The user needs to register for smUSD first!');
      console.log('   The user must call the register() function from their wallet.');
      console.log('\n   Option 1: User visits the dApp and clicks "Register for smUSD"');
      console.log('   Option 2: User calls register() directly on the contract\n');
    }
  }

  console.log('📌 For MOVE gas tokens:');
  console.log('   Visit: https://faucet.movementnetwork.xyz/');
  console.log('   Connect your Nightly wallet and request tokens\n');
  
  console.log('🔗 View on Explorer:');
  console.log(`   https://explorer.movementnetwork.xyz/account/${TEST_USER_ADDRESS}?network=testnet\n`);
}

fundTestUser().catch(console.error);

