#!/usr/bin/env node

/**
 * Diagnostic script to check on-chain markets directly from the blockchain
 */

const fs = require('fs');
const path = require('path');

const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';

async function getMarketsFromBlockchain() {
  console.log('🔍 Fetching markets directly from blockchain...\n');
  console.log(`Node URL: ${NODE_URL}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

  const response = await fetch(`${NODE_URL}/view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_markets`,
      type_arguments: [],
      arguments: []
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch markets: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data[0]; // Markets are in the first element
}

async function main() {
  try {
    const markets = await getMarketsFromBlockchain();
    
    console.log(`📊 Found ${markets.length} markets on-chain\n`);
    
    // Write to JSON file
    const outputPath = path.join(__dirname, 'on-chain-markets.json');
    fs.writeFileSync(outputPath, JSON.stringify(markets, null, 2));
    
    console.log(`✅ Written to ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

