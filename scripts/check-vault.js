#!/usr/bin/env node

/**
 * Check the actual resource account (vault) address and its smUSD balance
 */

const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';

async function getResourceAccountAddress() {
  // Get the BettingState to find the signer_cap, which tells us the resource account address
  const response = await fetch(`${NODE_URL}/accounts/${CONTRACT_ADDRESS}/resources`);
  
  if (!response.ok) {
    throw new Error(`Failed to get resources: ${await response.text()}`);
  }

  const resources = await response.json();
  
  // Find BettingState
  const bettingState = resources.find(r => r.type.includes('BettingState'));
  if (!bettingState) {
    throw new Error('BettingState not found');
  }
  
  // The signer_cap contains the resource account address
  const signerCap = bettingState.data.signer_cap;
  console.log('Signer Capability:', JSON.stringify(signerCap, null, 2));
  
  return signerCap.account;
}

async function getSmUsdBalance(address) {
  const response = await fetch(`${NODE_URL}/accounts/${address}/resources`);
  
  if (!response.ok) {
    const text = await response.text();
    if (text.includes('not found')) {
      return { exists: false, balance: 0 };
    }
    throw new Error(`Failed to get resources: ${text}`);
  }

  const resources = await response.json();
  
  // Find smUSD CoinStore
  const coinStore = resources.find(r => 
    r.type.includes('CoinStore') && r.type.includes('smusd')
  );
  
  if (!coinStore) {
    return { exists: true, balance: 0, hasCoinStore: false };
  }
  
  return { 
    exists: true, 
    balance: Number(coinStore.data.coin?.value || 0),
    hasCoinStore: true
  };
}

async function main() {
  console.log('🔐 Checking Resource Account (Vault)\n');
  console.log('='.repeat(60));

  try {
    // Get resource account address
    const resourceAddr = await getResourceAccountAddress();
    console.log(`\n📍 Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`📍 Resource Account (Vault): ${resourceAddr}`);
    
    // Check smUSD at both addresses
    console.log('\n--- smUSD Balances ---\n');
    
    const contractBalance = await getSmUsdBalance(CONTRACT_ADDRESS);
    console.log(`Contract Address (${CONTRACT_ADDRESS.slice(0,10)}...):`);
    console.log(`  smUSD: ${contractBalance.balance / 100_000_000} smUSD`);
    
    const vaultBalance = await getSmUsdBalance(resourceAddr);
    console.log(`\nResource Account (${resourceAddr.slice(0,10)}...):`);
    if (!vaultBalance.exists) {
      console.log(`  ⚠️  Account does not exist!`);
    } else if (!vaultBalance.hasCoinStore) {
      console.log(`  ⚠️  No smUSD CoinStore registered!`);
    } else {
      console.log(`  smUSD: ${vaultBalance.balance / 100_000_000} smUSD`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (contractBalance.balance > 0 && vaultBalance.balance === 0) {
      console.log('\n⚠️  ISSUE FOUND: smUSD is at contract address, not the vault!');
      console.log('   Bets/payouts use the vault address, so they can\'t access these funds.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

