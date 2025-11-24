import { NextResponse } from 'next/server';
import { TheOddsApi } from '@/app/services/TheOddsApi';
import { SportsBettingContract } from '@/app/services/SportsBettingContract';
import { MarketData } from '@/app/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  
  try {
    // Get markets from API (currently mock data)
    const markets: MarketData[] = await TheOddsApi.getMarkets(sport);
    
    // Always sync to blockchain
    const syncResults = {
      total: markets.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process markets and sync to blockchain
    for (const market of markets) {
      try {
        // Only sync markets that haven't started yet
        const commenceTime = new Date(market.commence_time).getTime();
        const now = Date.now();
        
        if (commenceTime > now) {
          const txHash = await SportsBettingContract.createMarket(market);
          console.log(`✅ Market synced: ${market.id} - TX: ${txHash}`);
          syncResults.created++;
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

