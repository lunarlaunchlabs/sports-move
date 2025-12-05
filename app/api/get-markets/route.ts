import { NextResponse } from 'next/server';
import { SportsBettingContract, OnChainMarket } from '@/app/services/SportsBettingContract';
import { SPORT_KEY } from '@/app/types/the-odds-api';

// Map competition tab names to SPORT_KEY enum values
const COMPETITION_TO_SPORT_KEY: Record<string, SPORT_KEY | null> = {
  all: null, // null means no sport_key filtering
  nfl: SPORT_KEY.NFL,
  nba: SPORT_KEY.NBA,
  nhl: SPORT_KEY.NHL,
  mlb: SPORT_KEY.MLB,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';
  const competition = searchParams.get('competition');
  
  // Validate competition parameter is provided
  if (!competition) {
    return NextResponse.json(
      { 
        error: 'Missing required parameter: competition', 
        details: 'Competition parameter is required. Valid values: all, nfl, nba, nhl, mlb',
        markets: [],
        count: 0
      },
      { status: 400 }
    );
  }
  
  const normalizedCompetition = competition.toLowerCase();
  
  // Validate competition value
  if (!(normalizedCompetition in COMPETITION_TO_SPORT_KEY)) {
    return NextResponse.json(
      { 
        error: 'Invalid competition value', 
        details: `Valid values are: ${Object.keys(COMPETITION_TO_SPORT_KEY).join(', ')}`,
        markets: [],
        count: 0
      },
      { status: 400 }
    );
  }
  
  try {
    // Get all markets from blockchain
    const allMarkets = await SportsBettingContract.getAllMarkets();
    
    // Apply status filter
    let filteredMarkets: OnChainMarket[];
    
    switch (filter.toLowerCase()) {
      case 'active':
        // Active: not resolved and not cancelled
        filteredMarkets = allMarkets.filter(m => !m.is_resolved && !m.is_cancelled);
        break;
        
      case 'resolved':
        // Resolved: is_resolved = true, is_cancelled = false
        filteredMarkets = allMarkets.filter(m => m.is_resolved && !m.is_cancelled);
        break;
        
      case 'cancelled':
        // Cancelled: is_cancelled = true
        filteredMarkets = allMarkets.filter(m => m.is_cancelled);
        break;
        
      case 'all':
      default:
        // All markets
        filteredMarkets = allMarkets;
        break;
    }
    
    // Apply competition/sport filter (if not "all")
    const sportKey = COMPETITION_TO_SPORT_KEY[normalizedCompetition];
    if (sportKey !== null) {
      filteredMarkets = filteredMarkets.filter(m => m.sport_key === sportKey);
    }
    
    return NextResponse.json({
      markets: filteredMarkets,
      filter: filter.toLowerCase(),
      competition: normalizedCompetition,
      count: filteredMarkets.length,
      total: allMarkets.length
    });
  } catch (error: any) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch markets', 
        details: error.message,
        markets: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

