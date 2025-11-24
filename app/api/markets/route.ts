import { NextResponse } from 'next/server';
import { TheOddsApi } from '@/app/services/TheOddsApi';
import { MarketData } from '@/app/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  
  const markets: MarketData[] = await TheOddsApi.getMarkets(sport);
  return NextResponse.json(markets);
}

