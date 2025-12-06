#!/usr/bin/env node

/**
 * Test market update by calling create_market on an existing market
 * and checking if the odds/timestamp actually change
 */

const { AptosClient, AptosAccount, HexString } = require('aptos');

const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';
const ADMIN1_PRIVATE_KEY = '0x8424863dda9e0238cea0c8c6d2c79de9b3778bb54983b5202dbbd29982c29fa9';

// Use an existing market - Miami Heat vs Orlando Magic
const TEST_GAME_ID = 'aeb6990f23d3e646900b2ec784699724';

async function getMarket(client, gameId) {
  const response = await fetch(`${NODE_URL}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_market`,
      type_arguments: [],
      arguments: [gameId]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get market: ${await response.text()}`);
  }
  
  const data = await response.json();
  return data[0];
}

async function main() {
  console.log('🧪 Testing Market Update\n');
  console.log('='.repeat(70));
  
  const client = new AptosClient(NODE_URL);
  const admin = new AptosAccount(new HexString(ADMIN1_PRIVATE_KEY).toUint8Array());
  
  console.log(`\nAdmin: ${admin.address().hex()}`);
  console.log(`Game ID: ${TEST_GAME_ID}\n`);

  try {
    // Get current market state
    console.log('📊 BEFORE - Current market state:');
    const before = await getMarket(client, TEST_GAME_ID);
    console.log(`   Home: ${before.home_team} | Odds: ${before.home_odds_positive ? '+' : '-'}${before.home_odds}`);
    console.log(`   Away: ${before.away_team} | Odds: ${before.away_odds_positive ? '+' : '-'}${before.away_odds}`);
    console.log(`   Last Update: ${before.odds_last_update} (${new Date(Number(before.odds_last_update) * 1000).toISOString()})`);
    console.log(`   Resolved: ${before.is_resolved}, Cancelled: ${before.is_cancelled}`);
    
    // Call create_market with NEW odds (different from current)
    const newHomeOdds = Number(before.home_odds) + 10; // Slightly different
    const newAwayOdds = Number(before.away_odds) + 10;
    
    console.log(`\n📤 Calling create_market with new odds:`);
    console.log(`   New Home Odds: ${before.home_odds_positive ? '+' : '-'}${newHomeOdds}`);
    console.log(`   New Away Odds: ${before.away_odds_positive ? '+' : '-'}${newAwayOdds}`);
    
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::sports_betting::create_market`,
      type_arguments: [],
      arguments: [
        TEST_GAME_ID,
        before.sport_key,
        before.sport_title,
        before.home_team,
        before.away_team,
        before.commence_time,
        newHomeOdds.toString(),
        before.home_odds_positive,
        newAwayOdds.toString(),
        before.away_odds_positive
      ]
    };

    const txn = await client.generateTransaction(admin.address(), payload);
    const signedTxn = await client.signTransaction(admin, txn);
    const result = await client.submitTransaction(signedTxn);
    
    console.log(`\n   TX Hash: ${result.hash}`);
    console.log('   Waiting for confirmation...');
    
    const txResult = await client.waitForTransactionWithResult(result.hash);
    
    console.log(`\n   Success: ${txResult.success}`);
    console.log(`   VM Status: ${txResult.vm_status}`);
    console.log(`   Gas Used: ${txResult.gas_used}`);
    
    // Check events
    if (txResult.events && txResult.events.length > 0) {
      console.log(`\n   Events (${txResult.events.length}):`);
      txResult.events.forEach((e, i) => {
        console.log(`   [${i + 1}] ${e.type}`);
      });
    } else {
      console.log(`\n   No events emitted (update path, not create)`);
    }
    
    // Get market state AFTER
    console.log('\n📊 AFTER - New market state:');
    const after = await getMarket(client, TEST_GAME_ID);
    console.log(`   Home: ${after.home_team} | Odds: ${after.home_odds_positive ? '+' : '-'}${after.home_odds}`);
    console.log(`   Away: ${after.away_team} | Odds: ${after.away_odds_positive ? '+' : '-'}${after.away_odds}`);
    console.log(`   Last Update: ${after.odds_last_update} (${new Date(Number(after.odds_last_update) * 1000).toISOString()})`);
    
    // Compare
    console.log('\n📋 COMPARISON:');
    console.log(`   Home Odds: ${before.home_odds} → ${after.home_odds} (${before.home_odds === after.home_odds ? '❌ UNCHANGED' : '✅ CHANGED'})`);
    console.log(`   Away Odds: ${before.away_odds} → ${after.away_odds} (${before.away_odds === after.away_odds ? '❌ UNCHANGED' : '✅ CHANGED'})`);
    console.log(`   Timestamp: ${before.odds_last_update} → ${after.odds_last_update} (${before.odds_last_update === after.odds_last_update ? '❌ UNCHANGED' : '✅ CHANGED'})`);
    
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.transaction) {
      console.error('   TX:', error.transaction);
    }
    process.exit(1);
  }
}

main();

