#!/usr/bin/env node

/**
 * Check the contract's house balance and actual smUSD balance
 */

const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';

async function getHouseBalance() {
  const response = await fetch(`${NODE_URL}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_house_balance`,
      type_arguments: [],
      arguments: []
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get house balance: ${await response.text()}`);
  }

  const data = await response.json();
  return data[0];
}

async function getResourceAccountAddress() {
  // The resource account is created with seed "sports_betting_vault"
  // We need to derive it from the contract address
  // For now, let's check if we can get it from the state
  
  // Actually, let's check the contract's coin balance directly
  // The resource account holds the smUSD
  
  // First, let's try to get all resources at the contract address
  const response = await fetch(`${NODE_URL}/accounts/${CONTRACT_ADDRESS}/resources`);
  
  if (!response.ok) {
    throw new Error(`Failed to get resources: ${await response.text()}`);
  }

  return await response.json();
}

async function main() {
  console.log('🏦 Checking Contract Balances\n');
  console.log(`Contract Address: ${CONTRACT_ADDRESS}\n`);
  console.log('='.repeat(60));

  try {
    // Get house balance (tracked variable)
    const houseBalance = await getHouseBalance();
    console.log(`\n📊 House Balance (tracked): ${houseBalance}`);
    console.log(`   In smUSD: ${Number(houseBalance) / 100_000_000} smUSD`);

    // Get all resources to find the BettingState and smUSD balances
    const resources = await getResourceAccountAddress();
    
    console.log(`\n📦 Resources at contract address (${resources.length} total):`);
    
    // Look for relevant resources
    for (const resource of resources) {
      if (resource.type.includes('BettingState')) {
        console.log(`\n   BettingState found:`);
        console.log(`   - house_balance: ${resource.data.house_balance}`);
        console.log(`   - markets count: ${resource.data.markets?.length || 0}`);
        console.log(`   - bets count: ${resource.data.bets?.length || 0}`);
        console.log(`   - next_bet_id: ${resource.data.next_bet_id}`);
      }
      
      if (resource.type.includes('CoinStore') && resource.type.includes('smusd')) {
        console.log(`\n   smUSD CoinStore found:`);
        console.log(`   - coin value: ${resource.data.coin?.value || 0}`);
        console.log(`   - In smUSD: ${Number(resource.data.coin?.value || 0) / 100_000_000} smUSD`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

