import { NextResponse } from 'next/server';
import { TheOddsApi } from '@/app/services/TheOddsApi';
import { SportsBettingContract } from '@/app/services/SportsBettingContract';
import { MarketData, SPORT_MARKET_KEY } from '@/app/types';

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
    // Get markets from The Odds API
    const markets: MarketData[] = await TheOddsApi.getMarkets(sport as SPORT_MARKET_KEY);
    
    // Sync results tracking
    const syncResults = {
      total: markets.length,
      synced: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process markets and sync to blockchain
    // The contract's create_market function handles duplicates:
    // - If market exists and active: updates odds only
    // - If market exists and resolved/cancelled: ignores
    // - If market doesn't exist: creates new
    for (const market of markets) {
      try {
        // Only sync markets that haven't started yet
        const commenceTime = new Date(market.commence_time).getTime();
        const now = Date.now();
        
        if (commenceTime > now) {
          // Call createMarket - contract handles create vs update internally
          const txHash = await SportsBettingContract.createMarket(market);
          console.log(`✅ Market synced: ${market.id} - TX: ${txHash}`);
          syncResults.synced++;
        } else {
          console.log(`⏭️  Market already started, skipping: ${market.id}`);
          syncResults.skipped++;
        }
      } catch (error: any) {
        console.error(`❌ Failed to sync market ${market.id}:`, error.message);
        syncResults.failed++;
        syncResults.errors.push(`${market.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      markets,
      blockchain: syncResults
    });
  } catch (error: any) {
    console.error('Error in markets API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets', details: error.message },
      { status: 500 }
    );
  }
}
