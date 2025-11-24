import { NextResponse } from 'next/server';
import { TheOddsApi } from '@/app/services/TheOddsApi';
import { ScoreData } from '@/app/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  
  const scores: ScoreData[] = await TheOddsApi.getScores(sport);
  return NextResponse.json(scores);
}

