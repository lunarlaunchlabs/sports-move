#!/usr/bin/env node

/**
 * Sports Move Job Script
 * 
 * This script is designed to be run by GitHub Actions to sync markets and scores
 * for all supported sports on the Sports Move platform.
 * 
 * Usage:
 *   node sports-move-job.js --job=markets
 *   node sports-move-job.js --job=scores
 * 
 * Environment:
 *   PRODUCTION_URL - Base URL for the API (default: https://sports-move.vercel.app)
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://sports-move.vercel.app';

// Sport market keys from the-odds-api.ts
const SPORT_MARKET_KEYS = [
  'americanfootball_nfl',
  'basketball_nba',
  'icehockey_nhl',
  'baseball_mlb'
];

/**
 * Makes a GET request to the specified endpoint
 */
async function fetchEndpoint(endpoint, sport) {
  const url = `${PRODUCTION_URL}/api/${endpoint}?sport=${sport}`;
  console.log(`\n🔄 Fetching: ${url}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'sports-move-job/1.0'
      }
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success (${duration}ms) - ${endpoint} for ${sport}`);
    
    // Log summary based on endpoint type
    if (endpoint === 'markets' && data.blockchain) {
      console.log(`   📊 Markets: ${data.blockchain.total} total, ${data.blockchain.synced} synced, ${data.blockchain.skipped} skipped, ${data.blockchain.failed} failed`);
    } else if (endpoint === 'scores' && data.blockchain) {
      console.log(`   📊 Scores: ${data.blockchain.total} total, ${data.blockchain.resolved} resolved, ${data.blockchain.settled} settled, ${data.blockchain.skipped} skipped`);
    }
    
    return { success: true, sport, data, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed (${duration}ms) - ${endpoint} for ${sport}: ${error.message}`);
    return { success: false, sport, error: error.message, duration };
  }
}

/**
 * Run the markets rotation job
 */
async function runMarketsJob() {
  console.log('🏈 Starting Markets Rotation Job');
  console.log(`📡 Target: ${PRODUCTION_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('─'.repeat(50));
  
  const results = [];
  
  for (let i = 0; i < SPORT_MARKET_KEYS.length; i++) {
    const sport = SPORT_MARKET_KEYS[i];
    console.log(`\n🏟️  [${i + 1}/${SPORT_MARKET_KEYS.length}] Processing sport: ${sport}`);
    const result = await fetchEndpoint('markets', sport);
    results.push(result);
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Run the scores update job
 */
async function runScoresJob() {
  console.log('🏆 Starting Scores Update Job');
  console.log(`📡 Target: ${PRODUCTION_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('─'.repeat(50));
  
  const results = [];
  
  for (let i = 0; i < SPORT_MARKET_KEYS.length; i++) {
    const sport = SPORT_MARKET_KEYS[i];
    console.log(`\n🏟️  [${i + 1}/${SPORT_MARKET_KEYS.length}] Processing sport: ${sport}`);
    const result = await fetchEndpoint('scores', sport);
    results.push(result);
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Print summary of results
 */
function printSummary(results, jobType) {
  console.log('\n' + '═'.repeat(50));
  console.log(`📋 ${jobType.toUpperCase()} JOB SUMMARY`);
  console.log('═'.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  
  if (failed > 0) {
    console.log('\n⚠️  Failed Sports:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.sport}: ${r.error}`);
    });
  }
  
  console.log('═'.repeat(50));
  
  return failed === 0;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const jobArg = args.find(arg => arg.startsWith('--job='));
  
  if (!jobArg) {
    console.error('❌ Error: Missing --job argument');
    console.log('Usage: node sports-move-job.js --job=markets|scores');
    process.exit(1);
  }
  
  const jobType = jobArg.split('=')[1];
  
  let results;
  
  switch (jobType) {
    case 'markets':
      results = await runMarketsJob();
      break;
    case 'scores':
      results = await runScoresJob();
      break;
    default:
      console.error(`❌ Error: Invalid job type '${jobType}'`);
      console.log('Valid job types: markets, scores');
      process.exit(1);
  }
  
  const allSuccessful = printSummary(results, jobType);
  
  // Exit with error code if any requests failed
  if (!allSuccessful) {
    process.exit(1);
  }
  
  console.log('\n🎉 Job completed successfully!');
}

main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

