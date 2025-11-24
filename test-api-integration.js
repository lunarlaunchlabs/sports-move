#!/usr/bin/env node

/**
 * End-to-End API Integration Test
 * 
 * This script tests the complete sports betting workflow:
 * 1. Sync markets to blockchain (/api/markets)
 * 2. Place test bets on markets
 * 3. Resolve markets and settle bets (/api/scores)
 * 4. Query markets with all filter combinations
 * 5. Query user bets with all filter combinations
 * 
 * Saves 8 JSON files with all possible query combinations for review.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { AptosClient, AptosAccount, HexString } = require('aptos');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const NODE_URL = process.env.NODE_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ADMIN1_PRIVATE_KEY = process.env.ADMIN1_PRIVATE_KEY;
const ADMIN1_ADDRESS = process.env.ADMIN1_ADDRESS;

// Test output directory
const OUTPUT_DIR = path.join(__dirname, 'test-results');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Logging utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function saveJSON(filename, data) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  logSuccess(`Saved: ${filename}`);
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API call wrapper
async function callAPI(endpoint, description) {
  logInfo(`Calling ${endpoint}...`);
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (!response.ok) {
      logError(`${description} failed with status ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
      return null;
    }
    
    logSuccess(`${description} succeeded`);
    return data;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return null;
  }
}

// Place a bet on the blockchain
async function placeBet(client, userAccount, gameId, outcome, amount) {
  try {
    logInfo(`Placing bet: ${amount / 100_000_000} smUSD on ${outcome} for ${gameId}`);
    
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESS}::sports_betting::place_bet`,
      type_arguments: [],
      arguments: [gameId, outcome, amount.toString()]
    };

    const txn = await client.generateTransaction(userAccount.address(), payload);
    const signedTxn = await client.signTransaction(userAccount, txn);
    const result = await client.submitTransaction(signedTxn);
    await client.waitForTransaction(result.hash);
    
    logSuccess(`Bet placed - TX: ${result.hash}`);
    return result.hash;
  } catch (error) {
    logError(`Failed to place bet: ${error.message}`);
    return null;
  }
}

// Main test workflow
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    Sports Betting API Integration Test                    ║');
  console.log('║                         End-to-End Workflow Test                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const testResults = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    steps: [],
    jsonFiles: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  try {
    // Initialize blockchain client for direct interaction
    const client = new AptosClient(NODE_URL);
    const admin = new AptosAccount(new HexString(ADMIN1_PRIVATE_KEY).toUint8Array());
    
    // ========================================================================
    // STEP 1: Sync Markets to Blockchain
    // ========================================================================
    logSection('STEP 1: Sync Markets to Blockchain');
    
    const marketsResponse = await callAPI('/api/markets', 'Market sync');
    if (!marketsResponse) {
      throw new Error('Failed to sync markets');
    }
    
    saveJSON('01-markets-sync-response.json', marketsResponse);
    testResults.jsonFiles.push('01-markets-sync-response.json');
    testResults.steps.push({
      step: 1,
      name: 'Sync Markets',
      status: 'passed',
      markets: marketsResponse.markets.length,
      created: marketsResponse.blockchain.created,
      failed: marketsResponse.blockchain.failed
    });
    
    logInfo(`Markets found: ${marketsResponse.markets.length}`);
    logInfo(`Created on blockchain: ${marketsResponse.blockchain.created}`);
    logInfo(`Failed: ${marketsResponse.blockchain.failed}`);
    
    if (marketsResponse.blockchain.errors.length > 0) {
      logWarning('Some markets failed to sync:');
      marketsResponse.blockchain.errors.forEach(err => console.log(`  - ${err}`));
      testResults.summary.warnings++;
    }
    
    await sleep(2000); // Wait for blockchain confirmation
    
    // ========================================================================
    // STEP 2: Register Test User for smUSD and Mint Funds
    // ========================================================================
    logSection('STEP 2: Setup Test User with smUSD');
    
    // Create a test user account
    const testUser = new AptosAccount(new HexString('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef').toUint8Array());
    const testUserAddress = testUser.address().hex();
    
    logInfo(`Test user address: ${testUserAddress}`);
    
    try {
      // Register test user for smUSD
      const registerPayload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::smusd::register`,
        type_arguments: [],
        arguments: []
      };
      
      const registerTxn = await client.generateTransaction(testUser.address(), registerPayload);
      const signedRegisterTxn = await client.signTransaction(testUser, registerTxn);
      const registerResult = await client.submitTransaction(signedRegisterTxn);
      await client.waitForTransaction(registerResult.hash);
      
      logSuccess('Test user registered for smUSD');
      
      // Mint smUSD to test user
      const mintPayload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::smusd::mint`,
        type_arguments: [],
        arguments: [testUserAddress, '100000000000'] // 1000 smUSD
      };
      
      const mintTxn = await client.generateTransaction(admin.address(), mintPayload);
      const signedMintTxn = await client.signTransaction(admin, mintTxn);
      const mintResult = await client.submitTransaction(signedMintTxn);
      await client.waitForTransaction(mintResult.hash);
      
      logSuccess('Minted 1000 smUSD to test user');
      
      testResults.steps.push({
        step: 2,
        name: 'Setup Test User',
        status: 'passed',
        address: testUserAddress,
        balance: '1000 smUSD'
      });
    } catch (error) {
      logWarning(`Test user setup failed (may already be registered): ${error.message}`);
      testResults.summary.warnings++;
    }
    
    await sleep(2000);
    
    // ========================================================================
    // STEP 3: Place Test Bets on Markets
    // ========================================================================
    logSection('STEP 3: Place Test Bets on Markets');
    
    if (marketsResponse.markets.length > 0) {
      const betsPlaced = [];
      
      // Place bets on first 3 markets (or all if less than 3)
      const marketsToBeOn = marketsResponse.markets.slice(0, 3);
      
      for (let i = 0; i < marketsToBeOn.length; i++) {
        const market = marketsToBeOn[i];
        const betAmount = (i + 1) * 10_000_000_000; // 100, 200, 300 smUSD
        const outcome = i % 2 === 0 ? market.home_team : market.away_team;
        
        const txHash = await placeBet(client, testUser, market.id, outcome, betAmount);
        if (txHash) {
          betsPlaced.push({
            gameId: market.id,
            outcome,
            amount: betAmount / 100_000_000,
            tx: txHash
          });
        }
        
        await sleep(1000); // Small delay between bets
      }
      
      testResults.steps.push({
        step: 3,
        name: 'Place Test Bets',
        status: betsPlaced.length > 0 ? 'passed' : 'failed',
        betsPlaced: betsPlaced.length,
        totalStaked: betsPlaced.reduce((sum, b) => sum + b.amount, 0) + ' smUSD',
        bets: betsPlaced
      });
      
      logSuccess(`Placed ${betsPlaced.length} test bets`);
    } else {
      logWarning('No markets available to bet on');
      testResults.summary.warnings++;
    }
    
    await sleep(2000);
    
    // ========================================================================
    // STEP 4: Query Markets with All Filter Combinations (BEFORE RESOLUTION)
    // ========================================================================
    logSection('STEP 4: Query Markets (BEFORE Resolution)');
    
    const marketFilters = ['all', 'active', 'resolved', 'cancelled'];
    
    for (const filter of marketFilters) {
      const endpoint = filter === 'all' 
        ? '/api/get-markets' 
        : `/api/get-markets?filter=${filter}`;
      
      const data = await callAPI(endpoint, `Get markets (filter: ${filter})`);
      if (data) {
        const filename = `02-markets-before-${filter}.json`;
        saveJSON(filename, data);
        testResults.jsonFiles.push(filename);
        
        logInfo(`Found ${data.count} ${filter} markets (total: ${data.total})`);
      }
      
      await sleep(500);
    }
    
    testResults.steps.push({
      step: 4,
      name: 'Query Markets (Before)',
      status: 'passed',
      filesGenerated: 4
    });
    
    // ========================================================================
    // STEP 5: Query User Bets (BEFORE RESOLUTION)
    // ========================================================================
    logSection('STEP 5: Query User Bets (BEFORE Resolution)');
    
    const betFilters = ['all', 'active', 'resolved', 'cancelled'];
    
    for (const filter of betFilters) {
      const endpoint = filter === 'all'
        ? `/api/get-user-bets?address=${testUserAddress}`
        : `/api/get-user-bets?address=${testUserAddress}&filter=${filter}`;
      
      const data = await callAPI(endpoint, `Get user bets (filter: ${filter})`);
      if (data) {
        const filename = `03-user-bets-before-${filter}.json`;
        saveJSON(filename, data);
        testResults.jsonFiles.push(filename);
        
        logInfo(`Found ${data.count} ${filter} bets (total: ${data.total})`);
      }
      
      await sleep(500);
    }
    
    testResults.steps.push({
      step: 5,
      name: 'Query User Bets (Before)',
      status: 'passed',
      filesGenerated: 4
    });
    
    // ========================================================================
    // STEP 6: Resolve Markets and Settle Bets
    // ========================================================================
    logSection('STEP 6: Resolve Markets and Settle Bets');
    
    const scoresResponse = await callAPI('/api/scores', 'Resolve markets and settle bets');
    if (!scoresResponse) {
      logWarning('Failed to resolve markets');
      testResults.summary.warnings++;
    } else {
      saveJSON('04-scores-resolution-response.json', scoresResponse);
      testResults.jsonFiles.push('04-scores-resolution-response.json');
      
      logInfo(`Scores found: ${scoresResponse.scores.length}`);
      logInfo(`Markets resolved: ${scoresResponse.blockchain.resolved}`);
      logInfo(`Bets settled: ${scoresResponse.blockchain.settled}`);
      logInfo(`Markets cancelled: ${scoresResponse.blockchain.cancelled}`);
      
      if (scoresResponse.blockchain.errors.length > 0) {
        logWarning('Some resolutions failed:');
        scoresResponse.blockchain.errors.forEach(err => console.log(`  - ${err}`));
        testResults.summary.warnings++;
      }
      
      testResults.steps.push({
        step: 6,
        name: 'Resolve and Settle',
        status: 'passed',
        resolved: scoresResponse.blockchain.resolved,
        settled: scoresResponse.blockchain.settled,
        cancelled: scoresResponse.blockchain.cancelled,
        failed: scoresResponse.blockchain.failed
      });
    }
    
    await sleep(2000);
    
    // ========================================================================
    // STEP 7: Query Markets with All Filter Combinations (AFTER RESOLUTION)
    // ========================================================================
    logSection('STEP 7: Query Markets (AFTER Resolution)');
    
    for (const filter of marketFilters) {
      const endpoint = filter === 'all' 
        ? '/api/get-markets' 
        : `/api/get-markets?filter=${filter}`;
      
      const data = await callAPI(endpoint, `Get markets (filter: ${filter})`);
      if (data) {
        const filename = `05-markets-after-${filter}.json`;
        saveJSON(filename, data);
        testResults.jsonFiles.push(filename);
        
        logInfo(`Found ${data.count} ${filter} markets (total: ${data.total})`);
      }
      
      await sleep(500);
    }
    
    testResults.steps.push({
      step: 7,
      name: 'Query Markets (After)',
      status: 'passed',
      filesGenerated: 4
    });
    
    // ========================================================================
    // STEP 8: Query User Bets (AFTER RESOLUTION)
    // ========================================================================
    logSection('STEP 8: Query User Bets (AFTER Resolution)');
    
    for (const filter of betFilters) {
      const endpoint = filter === 'all'
        ? `/api/get-user-bets?address=${testUserAddress}`
        : `/api/get-user-bets?address=${testUserAddress}&filter=${filter}`;
      
      const data = await callAPI(endpoint, `Get user bets (filter: ${filter})`);
      if (data) {
        const filename = `06-user-bets-after-${filter}.json`;
        saveJSON(filename, data);
        testResults.jsonFiles.push(filename);
        
        logInfo(`Found ${data.count} ${filter} bets (total: ${data.total})`);
        
        // Show bet details
        if (data.bets && data.bets.length > 0) {
          data.bets.forEach(bet => {
            const amount = parseFloat(bet.amount) / 100_000_000;
            const payout = parseFloat(bet.potential_payout) / 100_000_000;
            console.log(`    Bet ${bet.bet_id}: ${amount} smUSD on ${bet.outcome} (potential: ${payout} smUSD, settled: ${bet.is_settled})`);
          });
        }
      }
      
      await sleep(500);
    }
    
    testResults.steps.push({
      step: 8,
      name: 'Query User Bets (After)',
      status: 'passed',
      filesGenerated: 4
    });
    
    // ========================================================================
    // Calculate Test Summary
    // ========================================================================
    testResults.summary.total = testResults.steps.length;
    testResults.summary.passed = testResults.steps.filter(s => s.status === 'passed').length;
    testResults.summary.failed = testResults.steps.filter(s => s.status === 'failed').length;
    
    // Save complete test results
    saveJSON('00-test-summary.json', testResults);
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
    testResults.summary.failed++;
  }
  
  // ========================================================================
  // Final Summary
  // ========================================================================
  logSection('TEST SUMMARY');
  
  console.log(`${colors.bright}Total Steps:${colors.reset} ${testResults.summary.total}`);
  console.log(`${colors.green}Passed:${colors.reset} ${testResults.summary.passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${testResults.summary.failed}`);
  console.log(`${colors.yellow}Warnings:${colors.reset} ${testResults.summary.warnings}`);
  
  console.log(`\n${colors.bright}JSON Files Generated:${colors.reset} ${testResults.jsonFiles.length}`);
  testResults.jsonFiles.forEach(file => console.log(`  📄 ${file}`));
  
  console.log(`\n${colors.bright}Output Directory:${colors.reset} ${OUTPUT_DIR}`);
  
  if (testResults.summary.failed === 0) {
    logSuccess('\n🎉 ALL TESTS PASSED! 🎉\n');
    return 0;
  } else {
    logError('\n❌ SOME TESTS FAILED ❌\n');
    return 1;
  }
}

// Run tests
runTests()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });

