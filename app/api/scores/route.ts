import { NextResponse } from 'next/server';
import { TheOddsApi } from '@/app/services/TheOddsApi';
import { SportsBettingContract } from '@/app/services/SportsBettingContract';
import { ScoreData, SPORT_MARKET_KEY } from '@/app/types';

// Valid sport keys for validation
const VALID_SPORTS = Object.values(SPORT_MARKET_KEY);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  
  // Validate sport parameter
  if (!sport) {
    return NextResponse.json(
      { error: 'Missing required parameter: sport', validSports: VALID_SPORTS },
      { status: 400 }
    );
  }
  
  if (!VALID_SPORTS.includes(sport as SPORT_MARKET_KEY)) {
    return NextResponse.json(
      { error: 'Invalid sport parameter', validSports: VALID_SPORTS },
      { status: 400 }
    );
  }
  
  try {
    // Get scores from The Odds API
    const scores: ScoreData[] = await TheOddsApi.getScores(sport as SPORT_MARKET_KEY);
    
    // Resolve results tracking
    const resolveResults = {
      total: scores.length,
      resolved: 0,
      settled: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process scores to resolve markets and settle bets
    for (const score of scores) {
      try {
        // Only process completed games
        if (score.completed) {
          // Check if market exists and is not already resolved
          const market = await SportsBettingContract.getMarket(score.id);
          
          if (!market) {
            console.log(`⚠️  Market not found on blockchain: ${score.id}`);
            resolveResults.skipped++;
            continue;
          }

          if (market.is_resolved) {
            console.log(`ℹ️  Market already resolved: ${score.id} (winner: ${market.winning_outcome})`);
            resolveResults.skipped++;
            continue;
          }

          if (market.is_cancelled) {
            console.log(`ℹ️  Market is cancelled: ${score.id}`);
            resolveResults.skipped++;
            continue;
          }

          // Resolve the market
          const resolveTxHash = await SportsBettingContract.resolveMarket(score);
          console.log(`✅ Market resolved: ${score.id} - TX: ${resolveTxHash}`);
          resolveResults.resolved++;

          // Settle bets immediately after resolving
          try {
            const settleTxHash = await SportsBettingContract.settleBets(score.id);
            console.log(`✅ Bets settled: ${score.id} - TX: ${settleTxHash}`);
            resolveResults.settled++;
          } catch (settleError: any) {
            console.error(`⚠️  Failed to settle bets for ${score.id}:`, settleError.message);
            // Continue even if settlement fails
          }
        } else {
          resolveResults.skipped++;
        }
      } catch (error: any) {
        console.error(`❌ Failed to resolve market ${score.id}:`, error.message);
        resolveResults.failed++;
        resolveResults.errors.push(`${score.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      scores,
      blockchain: resolveResults
    });
  } catch (error: any) {
    console.error('Error in scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores', details: error.message },
      { status: 500 }
    );
  }
}
