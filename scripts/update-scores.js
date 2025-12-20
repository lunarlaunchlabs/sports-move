#!/usr/bin/env node

/**
 * Update Scores Script
 * 
 * This script fetches scores from The Odds API and resolves completed markets
 * on the blockchain, then settles any bets.
 * It runs directly in GitHub Actions without needing to call the NextJS API.
 * 
 * Usage:
 *   node scripts/update-scores.js
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
 * Fetch scores from The Odds API
 * @param {string} sport - The sport key (e.g., 'americanfootball_nfl')
 * @returns {Promise<Array>} Array of score data for recent games
 */
async function getScores(sport) {
  const url = `${THE_ODDS_API_BASE_URL}/${sport}/scores/?daysFrom=1&apiKey=${THE_ODDS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch scores: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// =============================================================================
// Blockchain Functions
// =============================================================================

/**
 * Get a specific market from the blockchain
 * @param {string} gameId - The game ID
 * @returns {Promise<Object|null>} Market data or null if not found
 */
async function getMarket(gameId) {
  try {
    const market = await client.view({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_market`,
      type_arguments: [],
      arguments: [gameId]
    });

    return market[0];
  } catch (error) {
    // Market not found
    return null;
  }
}

/**
 * Resolve a market based on score data
 * @param {Object} score - Score data from The Odds API
 * @returns {Promise<string>} Transaction hash
 */
async function resolveMarket(score) {
  const admin = new AptosAccount(new HexString(ADMIN_PRIVATE_KEY).toUint8Array());
  
  // Determine winning team
  let winningOutcome;
  if (!score.completed) {
    throw new Error('Matchup is not completed yet');
  }
  
  if (score.scores && score.scores.length === 2) {
    const homeScore = score.scores.find(s => s.name === score.home_team);
    const awayScore = score.scores.find(s => s.name === score.away_team);

    if (!homeScore || !awayScore) {
      throw new Error('Could not find scores for both teams');
    }

    const homeScoreNum = parseInt(homeScore.score);
    const awayScoreNum = parseInt(awayScore.score);

    if (homeScoreNum > awayScoreNum) {
      winningOutcome = score.home_team;
    } else if (awayScoreNum > homeScoreNum) {
      winningOutcome = score.away_team;
    } else {
      // In case of a tie, cancel the market
      return await cancelMarket(score.id);
    }
  } else {
    throw new Error('Invalid score data');
  }

  const payload = {
    type: 'entry_function_payload',
    function: `${CONTRACT_ADDRESS}::sports_betting::resolve_market`,
    type_arguments: [],
    arguments: [
      score.id,        // game_id
      winningOutcome   // winning_outcome
    ]
  };

  const txn = await client.generateTransaction(admin.address(), payload);
  const signedTxn = await client.signTransaction(admin, txn);
  const result = await client.submitTransaction(signedTxn);
  await client.waitForTransaction(result.hash, { timeoutSecs: 120 });

  return result.hash;
}

/**
 * Cancel a market and trigger refunds
 * @param {string} gameId - The game ID
 * @returns {Promise<string>} Transaction hash
 */
async function cancelMarket(gameId) {
  const admin = new AptosAccount(new HexString(ADMIN_PRIVATE_KEY).toUint8Array());

  const payload = {
    type: 'entry_function_payload',
    function: `${CONTRACT_ADDRESS}::sports_betting::cancel_market`,
    type_arguments: [],
    arguments: [gameId]
  };

  const txn = await client.generateTransaction(admin.address(), payload);
  const signedTxn = await client.signTransaction(admin, txn);
  const result = await client.submitTransaction(signedTxn);
  await client.waitForTransaction(result.hash, { timeoutSecs: 120 });

  return result.hash;
}

/**
 * Settle bets for a resolved market
 * @param {string} gameId - The game ID
 * @returns {Promise<string>} Transaction hash
 */
async function settleBets(gameId) {
  const admin = new AptosAccount(new HexString(ADMIN_PRIVATE_KEY).toUint8Array());

  const payload = {
    type: 'entry_function_payload',
    function: `${CONTRACT_ADDRESS}::sports_betting::settle_bets`,
    type_arguments: [],
    arguments: [gameId]
  };

  const txn = await client.generateTransaction(admin.address(), payload);
  const signedTxn = await client.signTransaction(admin, txn);
  const result = await client.submitTransaction(signedTxn);
  await client.waitForTransaction(result.hash, { timeoutSecs: 120 });

  return result.hash;
}

// =============================================================================
// Main Job Logic
// =============================================================================

/**
 * Process scores for a single sport
 * @param {string} sport - Sport key
 * @returns {Promise<Object>} Results for this sport
 */
async function processSport(sport) {
  console.log(`\n🏟️  Fetching scores for: ${sport}`);
  
  const resolveResults = {
    sport,
    total: 0,
    resolved: 0,
    settled: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    const scores = await getScores(sport);
    resolveResults.total = scores.length;
    console.log(`   Found ${scores.length} scores`);

    for (const score of scores) {
      try {
        // Only process completed games
        if (score.completed) {
          // Check if market exists and is not already resolved
          const market = await getMarket(score.id);
          
          if (!market) {
            console.log(`   ⚠️  Market not found on blockchain: ${score.id}`);
            resolveResults.skipped++;
            continue;
          }

          if (market.is_resolved) {
            console.log(`   ℹ️  Market already resolved: ${score.id} (winner: ${market.winning_outcome})`);
            resolveResults.skipped++;
            continue;
          }

          if (market.is_cancelled) {
            console.log(`   ℹ️  Market is cancelled: ${score.id}`);
            resolveResults.skipped++;
            continue;
          }

          // Resolve the market
          const resolveTxHash = await resolveMarket(score);
          console.log(`   ✅ Market resolved: ${score.id} - TX: ${resolveTxHash}`);
          resolveResults.resolved++;

          // Settle bets immediately after resolving
          try {
            const settleTxHash = await settleBets(score.id);
            console.log(`   ✅ Bets settled: ${score.id} - TX: ${settleTxHash}`);
            resolveResults.settled++;
          } catch (settleError) {
            console.error(`   ⚠️  Failed to settle bets for ${score.id}: ${settleError.message}`);
            // Continue even if settlement fails
          }
        } else {
          resolveResults.skipped++;
        }
      } catch (error) {
        console.error(`   ❌ Failed to resolve market ${score.id}: ${error.message}`);
        resolveResults.failed++;
        resolveResults.errors.push(`${score.id}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Failed to fetch scores for ${sport}: ${error.message}`);
    resolveResults.errors.push(`Fetch error: ${error.message}`);
  }

  return resolveResults;
}

/**
 * Print summary of all results
 * @param {Array} results - Array of sport results
 */
function printSummary(results) {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 SCORES UPDATE JOB SUMMARY');
  console.log('═'.repeat(60));

  let totalScores = 0;
  let totalResolved = 0;
  let totalSettled = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const result of results) {
    console.log(`\n${result.sport}:`);
    console.log(`   Total: ${result.total}, Resolved: ${result.resolved}, Settled: ${result.settled}, Skipped: ${result.skipped}, Failed: ${result.failed}`);
    totalScores += result.total;
    totalResolved += result.resolved;
    totalSettled += result.settled;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`TOTAL: ${totalScores} scores, ${totalResolved} resolved, ${totalSettled} settled, ${totalSkipped} skipped, ${totalFailed} failed`);
  console.log('═'.repeat(60));

  return totalFailed === 0;
}

/**
 * Main entry point
 */
async function main() {
  console.log('🏆 Starting Scores Update Job');
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
    console.log('\n⚠️  Some markets failed to resolve');
    process.exit(1);
  }

  console.log('\n🎉 Scores update completed successfully!');
}

main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
