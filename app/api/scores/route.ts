import { NextResponse } from 'next/server';
import { TheOddsApi } from '@/app/services/TheOddsApi';
import { SportsBettingContract } from '@/app/services/SportsBettingContract';
import { ScoreData } from '@/app/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  
  try {
    // Get scores from API (currently mock data)
    const scores: ScoreData[] = await TheOddsApi.getScores(sport);
    
    // Always resolve markets and settle bets
    const resolveResults = {
      total: scores.length,
      resolved: 0,
      settled: 0,
      cancelled: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process scores to resolve markets and settle bets
    for (const score of scores) {
      try {
        // Only process completed games
        if (score.completed) {
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

