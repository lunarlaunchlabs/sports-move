#!/usr/bin/env node

/**
 * Check all bets on the contract
 */

const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';

async function getBettingState() {
  const response = await fetch(`${NODE_URL}/accounts/${CONTRACT_ADDRESS}/resources`);
  
  if (!response.ok) {
    throw new Error(`Failed to get resources: ${await response.text()}`);
  }

  const resources = await response.json();
  const bettingState = resources.find(r => r.type.includes('BettingState'));
  
  if (!bettingState) {
    throw new Error('BettingState not found');
  }
  
  return bettingState.data;
}

async function main() {
  console.log('📊 Checking All Bets\n');
  console.log('='.repeat(70));

  try {
    const state = await getBettingState();
    const bets = state.bets || [];
    
    console.log(`\nTotal bets: ${bets.length}`);
    console.log(`House balance (tracked): ${Number(state.house_balance) / 100_000_000} smUSD`);
    console.log(`Next bet ID: ${state.next_bet_id}\n`);
    
    let totalBetAmount = 0;
    let totalPotentialPayout = 0;
    let settledCount = 0;
    
    console.log('--- Individual Bets ---\n');
    
    bets.forEach((bet, i) => {
      const amount = Number(bet.amount) / 100_000_000;
      const potentialPayout = Number(bet.potential_payout) / 100_000_000;
      const odds = bet.odds_positive ? `+${bet.odds}` : `-${bet.odds}`;
      
      totalBetAmount += amount;
      totalPotentialPayout += potentialPayout;
      if (bet.is_settled) settledCount++;
      
      console.log(`[Bet #${bet.bet_id}]`);
      console.log(`  User: ${bet.user.slice(0, 10)}...`);
      console.log(`  Game: ${bet.game_id.slice(0, 20)}...`);
      console.log(`  Outcome: ${bet.outcome}`);
      console.log(`  Amount: ${amount} smUSD`);
      console.log(`  Odds: ${odds}`);
      console.log(`  Potential Payout: ${potentialPayout} smUSD`);
      console.log(`  Settled: ${bet.is_settled}`);
      console.log('');
    });
    
    console.log('--- Summary ---\n');
    console.log(`Total bet amount: ${totalBetAmount} smUSD`);
    console.log(`Total potential payout: ${totalPotentialPayout} smUSD`);
    console.log(`Settled bets: ${settledCount} / ${bets.length}`);
    
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

