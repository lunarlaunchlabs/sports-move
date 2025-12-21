#!/usr/bin/env node

/**
 * Sports Move Job Script (Self-Managing Background Service)
 * 
 * This script runs continuously in the background, syncing markets and scores
 * for all supported sports on the Sports Move platform.
 * 
 * QUIET HOURS: 1AM - 8AM local time
 * - The script will pause during these hours to avoid unnecessary API calls
 * - If a job is running when 1AM hits, it will complete before pausing
 * - At 8AM sharp, the script automatically resumes
 * 
 * Usage:
 *   node local-sports-move-job.js
 * 
 * Environment:
 *   PRODUCTION_URL - Base URL for the API (default: https://sports-move.vercel.app)
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://sports-move.vercel.app';

// Quiet hours configuration (local time)
const QUIET_HOURS_START = 1;  // 1 AM
const QUIET_HOURS_END = 8;    // 8 AM

// Sport market keys from the-odds-api.ts
const SPORT_MARKET_KEYS = [
  'americanfootball_nfl',
  'basketball_nba',
  'icehockey_nhl',
  'baseball_mlb'
];

/**
 * Check if current time is within quiet hours (1AM - 8AM)
 */
function isQuietHours() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= QUIET_HOURS_START && hour < QUIET_HOURS_END;
}

/**
 * Calculate milliseconds until quiet hours end (8AM)
 */
function msUntilQuietHoursEnd() {
  const now = new Date();
  const wakeTime = new Date(now);
  
  // Set to 8AM today
  wakeTime.setHours(QUIET_HOURS_END, 0, 0, 0);
  
  // If we're past 8AM today (shouldn't happen if isQuietHours is true), set to tomorrow
  if (wakeTime <= now) {
    wakeTime.setDate(wakeTime.getDate() + 1);
  }
  
  return wakeTime.getTime() - now.getTime();
}

/**
 * Format milliseconds as human-readable duration
 */
function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * Sleep until quiet hours end
 */
async function sleepUntilWakeTime() {
  const sleepDuration = msUntilQuietHoursEnd();
  const wakeTime = new Date(Date.now() + sleepDuration);
  
  console.log('\n' + '🌙'.repeat(25));
  console.log(`😴 ENTERING QUIET HOURS (${QUIET_HOURS_START}AM - ${QUIET_HOURS_END}AM)`);
  console.log(`⏰ Current time: ${new Date().toLocaleTimeString()}`);
  console.log(`🌅 Will resume at: ${wakeTime.toLocaleTimeString()}`);
  console.log(`💤 Sleeping for: ${formatDuration(sleepDuration)}`);
  console.log('🌙'.repeat(25) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, sleepDuration));
  
  console.log('\n' + '☀️'.repeat(25));
  console.log(`🌅 WAKING UP - Quiet hours ended!`);
  console.log(`⏰ Current time: ${new Date().toLocaleTimeString()}`);
  console.log('☀️'.repeat(25) + '\n');
}

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
 * Run a single cycle of markets + scores jobs
 */
async function runJobCycle() {
  console.log(`\n🚀 Starting job cycle at ${new Date().toLocaleString()}`);
  
  const results1 = await runMarketsJob();
  printSummary(results1, 'markets');
  
  const results2 = await runScoresJob();
  printSummary(results2, 'scores');
  
  console.log(`✅ Job cycle completed at ${new Date().toLocaleString()}`);
}

/**
 * Main loop with quiet hours support
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('🏀 SPORTS MOVE LOCAL JOB SERVICE');
  console.log('═'.repeat(60));
  console.log(`📡 Target: ${PRODUCTION_URL}`);
  console.log(`🌙 Quiet Hours: ${QUIET_HOURS_START}AM - ${QUIET_HOURS_END}AM local time`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('═'.repeat(60));
  
  while (true) {
    // Check if we're in quiet hours before starting a new job
    if (isQuietHours()) {
      await sleepUntilWakeTime();
    }
    
    // Run the job cycle
    await runJobCycle();
    
    // Wait 10 seconds before next cycle
    // But first check if we just entered quiet hours
    if (isQuietHours()) {
      console.log(`\n🌙 Quiet hours started - will pause after this cycle completes`);
      // Don't wait, go straight to the top of the loop to sleep
      continue;
    }
    
    console.log(`\n⏳ Waiting 2 minutes before next cycle...`);
    await new Promise(resolve => setTimeout(resolve, 120000));
  }
}

// Start the service
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
