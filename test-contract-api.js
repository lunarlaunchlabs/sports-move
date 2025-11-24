#!/usr/bin/env node

/**
 * Test script for Mock Move Contract API
 * 
 * This script tests the POST and GET endpoints for the Movement smart contract integration.
 * 
 * Usage:
 *   node test-contract-api.js
 * 
 * Make sure the dev server is running: npm run dev
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';
const CONFIG_PATH = path.join(__dirname, 'mock-move/.movement/config.yaml');

// Helper function to extract private key from config.yaml
function getPrivateKey() {
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    // Handle both quoted and unquoted private keys
    const quotedMatch = configContent.match(/private_key:\s*"([^"]+)"/);
    const unquotedMatch = configContent.match(/private_key:\s*([^\s]+)/);
    
    let privateKey = quotedMatch ? quotedMatch[1] : (unquotedMatch ? unquotedMatch[1] : null);
    
    if (!privateKey) {
      throw new Error('Private key not found in config.yaml');
    }
    
    // Handle ed25519-priv- prefix format
    if (privateKey.startsWith('ed25519-priv-')) {
      privateKey = privateKey.replace('ed25519-priv-', '');
    }
    
    // Ensure it has 0x prefix
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    
    return privateKey;
  } catch (error) {
    console.error('Error reading config file:', error.message);
    console.log('\nPlease run the Movement CLI init command first:');
    console.log('  cd mock-move && movement init\n');
    process.exit(1);
  }
}

// Helper function to extract account address from config.yaml
function getAccountAddress() {
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    // Handle both quoted and unquoted account addresses
    const quotedMatch = configContent.match(/account:\s*"([^"]+)"/);
    const unquotedMatch = configContent.match(/account:\s*([^\s]+)/);
    
    let account = quotedMatch ? quotedMatch[1] : (unquotedMatch ? unquotedMatch[1] : null);
    
    if (!account) {
      throw new Error('Account address not found in config.yaml');
    }
    
    // Ensure it has 0x prefix
    if (!account.startsWith('0x')) {
      account = '0x' + account;
    }
    
    return account;
  } catch (error) {
    console.error('Error reading account address:', error.message);
    process.exit(1);
  }
}

async function testPostEndpoint() {
  console.log('=== Testing POST /api/mock-move-contract ===\n');
  
  const privateKey = getPrivateKey();
  const testData = {
    privateKey,
    message: `Test message at ${new Date().toISOString()}`,
    value: Math.floor(Math.random() * 1000)
  };

  console.log('Sending data to contract:');
  console.log('  Message:', testData.message);
  console.log('  Value:', testData.value);
  console.log('');

  try {
    const response = await fetch(`${API_BASE}/api/mock-move-contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ POST request failed');
      console.error('Status:', response.status);
      console.error('Error:', result);
      return null;
    }

    console.log('✅ POST request successful!');
    console.log('Transaction Hash:', result.transactionHash);
    console.log('Address:', result.address);
    console.log('Data written:', result.data);
    console.log('Explorer URL:', result.explorerUrl);
    console.log('');

    return result.address;
  } catch (error) {
    console.error('❌ POST request error:', error.message);
    console.log('\nMake sure:');
    console.log('1. The dev server is running (npm run dev)');
    console.log('2. Your account has testnet tokens from https://faucet.testnet.movementnetwork.xyz/');
    console.log('');
    return null;
  }
}

async function testGetEndpoint(address) {
  console.log('=== Testing GET /api/mock-move-contract ===\n');
  console.log('Reading data from address:', address);
  console.log('');

  try {
    const response = await fetch(`${API_BASE}/api/mock-move-contract?address=${address}`);
    const result = await response.json();

    if (!response.ok) {
      console.error('❌ GET request failed');
      console.error('Status:', response.status);
      console.error('Error:', result);
      return false;
    }

    console.log('✅ GET request successful!');
    console.log('Address:', result.address);
    console.log('Initialized:', result.initialized);
    console.log('Data:');
    console.log('  Message:', result.data.message);
    console.log('  Value:', result.data.value);
    console.log('  Is Active:', result.data.isActive);
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ GET request error:', error.message);
    return false;
  }
}

async function testGetField(address, field) {
  console.log(`=== Testing GET /api/mock-move-contract?field=${field} ===\n`);

  try {
    const response = await fetch(`${API_BASE}/api/mock-move-contract?address=${address}&field=${field}`);
    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ GET field request failed`);
      console.error('Status:', response.status);
      console.error('Error:', result);
      return false;
    }

    console.log(`✅ GET field request successful!`);
    console.log(`${field}:`, result.value);
    console.log('');

    return true;
  } catch (error) {
    console.error(`❌ GET field request error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Movement Network Contract API Test Suite\n');
  console.log('=' .repeat(50));
  console.log('');

  // Test 1: POST - Write data to contract
  const address = await testPostEndpoint();
  
  if (!address) {
    console.log('❌ Test suite failed: Could not write to contract');
    process.exit(1);
  }

  // Wait a bit for transaction to be processed
  console.log('⏳ Waiting 3 seconds for transaction to be confirmed...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 2: GET - Read all data from contract
  const getAllSuccess = await testGetEndpoint(address);
  
  if (!getAllSuccess) {
    console.log('❌ Test suite failed: Could not read from contract');
    process.exit(1);
  }

  // Test 3: GET - Read specific fields
  await testGetField(address, 'message');
  await testGetField(address, 'value');
  await testGetField(address, 'isActive');

  // Summary
  console.log('=' .repeat(50));
  console.log('');
  console.log('🎉 All tests passed!');
  console.log('');
  console.log('The API successfully:');
  console.log('  ✅ Wrote data to the Movement smart contract (POST)');
  console.log('  ✅ Read all data from the contract (GET)');
  console.log('  ✅ Read specific fields from the contract (GET with field param)');
  console.log('');
  console.log('Your Movement Network integration is working! 🚀');
  console.log('');
}

// Run the test suite
runTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

