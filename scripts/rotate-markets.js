#!/usr/bin/env node

/**
 * Rotate Markets Script
 * 
 * This script fetches markets from The Odds API and syncs them to the blockchain.
 * It runs directly in GitHub Actions without needing to call the NextJS API.
 * 
 * Usage:
 *   node scripts/rotate-markets.js
 */

const { AptosClient, AptosAccount, HexString } = require('aptos');

// =============================================================================
// Configuration (hardcoded values from existing services)
// =============================================================================

// The Odds API
const THE_ODDS_API_KEY = '90c8987732fc1f15372c6852892af9de';
const THE_ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4/sports';

// Blockchain (Movement Testnet)
const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';
const ADMIN_PRIVATE_KEY = '0x8424863dda9e0238cea0c8c6d2c79de9b3778bb54983b5202dbbd29982c29fa9';

// Sports to process
const SPORT_MARKET_KEYS = [
  'americanfootball_nfl',
  'basketball_nba',
  'icehockey_nhl',
  'baseball_mlb'
];

// Initialize Aptos client
const client = new AptosClient(NODE_URL);

// =============================================================================
// The Odds API Functions
// =============================================================================

/**
 * Fetch markets from The Odds API
 * @param {string} sport - The sport key (e.g., 'americanfootball_nfl')
 * @returns {Promise<Array>} Array of market data with bookmaker odds
 */
async function getMarkets(sport) {
  const url = `${THE_ODDS_API_BASE_URL}/${sport}/odds?regions=us&oddsFormat=american&apiKey=${THE_ODDS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch markets: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// =============================================================================
// Blockchain Functions
// =============================================================================

/**
 * Create a market on the blockchain
 * @param {Object} market - Market data from The Odds API
 * @returns {Promise<string>} Transaction hash
 */
async function createMarket(market) {
  try {
    const admin = new AptosAccount(new HexString(ADMIN_PRIVATE_KEY).toUint8Array());
    
    // Find FanDuel bookmaker odds
    const fanDuelBookmaker = market.bookmakers.find(b => b.key === 'fanduel');
    if (!fanDuelBookmaker) {
      throw new Error('FanDuel bookmaker not found');
    }

    // Get h2h (head-to-head) market odds
    const h2hMarket = fanDuelBookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket || h2hMarket.outcomes.length < 2) {
      throw new Error('H2H market or outcomes not found');
    }

    // Extract home and away odds
    const homeOutcome = h2hMarket.outcomes.find(o => o.name === market.home_team);
    const awayOutcome = h2hMarket.outcomes.find(o => o.name === market.away_team);

    if (!homeOutcome || !awayOutcome) {
      throw new Error('Could not find odds for both teams');
    }

    // Convert American odds to our format (u64 + boolean)
    const homeOdds = Math.abs(homeOutcome.price);
    const homeOddsIsPositive = homeOutcome.price > 0;
    const awayOdds = Math.abs(awayOutcome.price);
    const awayOddsIsPositive = awayOutcome.price > 0;

    // Convert commence_time to unix timestamp
    const commenceTime = Math.floor(new Date(market.commence_time).getTime() / 1000);

    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::sports_betting::create_market`,
      type_arguments: [],
      arguments: [
        market.id,                    // game_id
        market.sport_key,             // sport_key
        market.sport_title,           // sport_title
        market.home_team,             // home_team
        market.away_team,             // away_team
        commenceTime.toString(),      // commence_time
        homeOdds.toString(),          // home_odds
        homeOddsIsPositive,           // home_odds_positive
        awayOdds.toString(),          // away_odds
        awayOddsIsPositive            // away_odds_positive
      ]
    };

    const txn = await client.generateTransaction(admin.address(), payload);
    const signedTxn = await client.signTransaction(admin, txn);
    const result = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(result.hash);

    return result.hash;
  } catch (error) {
    // If market already exists, try to update odds instead
    if (error.message?.includes('EMARKET_ALREADY_EXISTS')) {
      return await updateMarketOdds(market);
    }
    throw new Error(`Failed to create market: ${error.message}`);
  }
}

/**
 * Update market odds on the blockchain
 * @param {Object} market - Market data from The Odds API
 * @returns {Promise<string>} Transaction hash
 */
async function updateMarketOdds(market) {
  const admin = new AptosAccount(new HexString(ADMIN_PRIVATE_KEY).toUint8Array());
  
  // Find FanDuel bookmaker odds
  const fanDuelBookmaker = market.bookmakers.find(b => b.key === 'fanduel');
  if (!fanDuelBookmaker) {
    throw new Error('FanDuel bookmaker not found');
  }

  const h2hMarket = fanDuelBookmaker.markets.find(m => m.key === 'h2h');
  if (!h2hMarket || h2hMarket.outcomes.length < 2) {
    throw new Error('H2H market or outcomes not found');
  }

  const homeOutcome = h2hMarket.outcomes.find(o => o.name === market.home_team);
  const awayOutcome = h2hMarket.outcomes.find(o => o.name === market.away_team);

  if (!homeOutcome || !awayOutcome) {
    throw new Error('Could not find odds for both teams');
  }

  const homeOdds = Math.abs(homeOutcome.price);
  const homeOddsIsPositive = homeOutcome.price > 0;
  const awayOdds = Math.abs(awayOutcome.price);
  const awayOddsIsPositive = awayOutcome.price > 0;

  const payload = {
    type: 'entry_function_payload',
    function: `${CONTRACT_ADDRESS}::sports_betting::update_market_odds`,
    type_arguments: [],
    arguments: [
      market.id,                // game_id
      homeOdds.toString(),      // home_odds
      homeOddsIsPositive,       // home_odds_positive
      awayOdds.toString(),      // away_odds
      awayOddsIsPositive        // away_odds_positive
    ]
  };

  const txn = await client.generateTransaction(admin.address(), payload);
  const signedTxn = await client.signTransaction(admin, txn);
  const result = await client.submitTransaction(signedTxn);
  await client.waitForTransaction(result.hash);

  return result.hash;
}

// =============================================================================
// Main Job Logic
// =============================================================================

/**
 * Process markets for a single sport
 * @param {string} sport - Sport key
 * @returns {Promise<Object>} Results for this sport
 */
async function processSport(sport) {
  console.log(`\n🏟️  Fetching markets for: ${sport}`);
  
  const syncResults = {
    sport,
    total: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    const markets = await getMarkets(sport);
    syncResults.total = markets.length;
    console.log(`   Found ${markets.length} markets`);

    for (const market of markets) {
      try {
        const txHash = await createMarket(market);
        console.log(`   ✅ Market synced: ${market.id} - TX: ${txHash}`);
        syncResults.synced++;
      } catch (error) {
        console.error(`   ❌ Failed to sync market ${market.id}: ${error.message}`);
        syncResults.failed++;
        syncResults.errors.push(`${market.id}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Failed to fetch markets for ${sport}: ${error.message}`);
    syncResults.errors.push(`Fetch error: ${error.message}`);
  }

  return syncResults;
}

/**
 * Print summary of all results
 * @param {Array} results - Array of sport results
 */
function printSummary(results) {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 MARKETS ROTATION JOB SUMMARY');
  console.log('═'.repeat(60));

  let totalMarkets = 0;
  let totalSynced = 0;
  let totalFailed = 0;

  for (const result of results) {
    console.log(`\n${result.sport}:`);
    console.log(`   Total: ${result.total}, Synced: ${result.synced}, Failed: ${result.failed}`);
    totalMarkets += result.total;
    totalSynced += result.synced;
    totalFailed += result.failed;
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`TOTAL: ${totalMarkets} markets, ${totalSynced} synced, ${totalFailed} failed`);
  console.log('═'.repeat(60));

  return totalFailed === 0;
}

/**
 * Main entry point
 */
async function main() {
  console.log('🏈 Starting Markets Rotation Job');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🔗 Node URL: ${NODE_URL}`);
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
  console.log('─'.repeat(60));

  const results = [];

  for (let i = 0; i < SPORT_MARKET_KEYS.length; i++) {
    const sport = SPORT_MARKET_KEYS[i];
    console.log(`\n[${i + 1}/${SPORT_MARKET_KEYS.length}] Processing ${sport}...`);
    const result = await processSport(sport);
    results.push(result);

    // Small delay between sports to avoid rate limiting
    if (i < SPORT_MARKET_KEYS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const allSuccessful = printSummary(results);

  if (!allSuccessful) {
    console.log('\n⚠️  Some markets failed to sync');
    process.exit(1);
  }

  console.log('\n🎉 Markets rotation completed successfully!');
}

main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
