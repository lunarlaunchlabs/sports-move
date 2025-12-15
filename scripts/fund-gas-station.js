#!/usr/bin/env node

/**
 * Fund the Shinami Gas Station with MOVE tokens on Movement Testnet
 */

const { FaucetClient } = require('aptos');

const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const FAUCET_URL = 'https://faucet.testnet.movementnetwork.xyz';

// Shinami Gas Station address
const GAS_STATION_WALLET = '0x9edd60f5ad0fc8e84c193ed011f536bfb8bd6ad12e3b6834aa1d24f5ffcdae97';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fundWallet(address, attempts = 100) {
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  
  console.log(`⛽ Funding Gas Station: ${address}\n`);
  console.log(`Network: Movement Testnet`);
  console.log(`Faucet: ${FAUCET_URL}\n`);
  
  let successCount = 0;
  
  for (let i = 0; i < attempts; i++) {
    process.stdout.write(`   Attempt ${i + 1}/${attempts}... `);
    try {
      await faucetClient.fundAccount(address, 100_000_000); // 1 MOVE
      console.log('✅');
      successCount++;
      await sleep(1500);
    } catch (error) {
      console.log(`❌ ${error.message}`);
      await sleep(2000);
    }
  }
  
  console.log(`\n✅ Successfully funded ${successCount} times (~${successCount} MOVE)`);
}

async function main() {
  const wallet = process.argv[2] || GAS_STATION_WALLET;
  
  if (!wallet.startsWith('0x') || wallet.length !== 66) {
    console.error('❌ Invalid wallet address. Must be 0x followed by 64 hex chars.');
    process.exit(1);
  }
  
  await fundWallet(wallet);
}

main().catch(console.error);
