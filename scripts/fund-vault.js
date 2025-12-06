#!/usr/bin/env node

/**
 * Fund the resource account (vault) with smUSD from the deployer account
 */

const { AptosClient, AptosAccount, HexString, CoinClient } = require('aptos');

const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';
const RESOURCE_ACCOUNT = '0xda35e6cfbf442c225bba264f5372b9c1db43f198b6ca6c2c4c7d53ade329bcf1';

// Deployer private key (from FRESH_DEPLOYMENT.json)
const DEPLOYER_PRIVATE_KEY = '0x2e63c5cb5ec301dfcc4dfffc2a06e6271b7a8390e0f57262feb07cbdd6a653a4';

// Amount to transfer: 15,000,000 smUSD (with 8 decimals)
const AMOUNT = 15_000_000 * 100_000_000; // 15M * 10^8

async function main() {
  console.log('💰 Funding Resource Account (Vault)\n');
  console.log('='.repeat(60));
  
  const client = new AptosClient(NODE_URL);
  const deployer = new AptosAccount(new HexString(DEPLOYER_PRIVATE_KEY).toUint8Array());
  
  console.log(`\nDeployer: ${deployer.address().hex()}`);
  console.log(`Resource Account: ${RESOURCE_ACCOUNT}`);
  console.log(`Amount: 15,000,000 smUSD\n`);

  try {
    // Transfer smUSD from deployer to resource account
    const payload = {
      type: 'entry_function_payload',
      function: '0x1::coin::transfer',
      type_arguments: [`${CONTRACT_ADDRESS}::smusd::SMUSD`],
      arguments: [RESOURCE_ACCOUNT, AMOUNT.toString()]
    };

    console.log('📤 Submitting transfer transaction...');
    
    const txn = await client.generateTransaction(deployer.address(), payload);
    const signedTxn = await client.signTransaction(deployer, txn);
    const result = await client.submitTransaction(signedTxn);
    
    console.log(`   TX Hash: ${result.hash}`);
    console.log('   Waiting for confirmation...');
    
    await client.waitForTransaction(result.hash);
    
    console.log('\n✅ Transfer complete!');
    
    // Verify the new balance
    console.log('\n--- Verifying Balances ---\n');
    
    const response = await fetch(`${NODE_URL}/accounts/${RESOURCE_ACCOUNT}/resources`);
    const resources = await response.json();
    const coinStore = resources.find(r => 
      r.type.includes('CoinStore') && r.type.includes('smusd')
    );
    
    if (coinStore) {
      const balance = Number(coinStore.data.coin?.value || 0) / 100_000_000;
      console.log(`Resource Account Balance: ${balance.toLocaleString()} smUSD`);
    }
    
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

