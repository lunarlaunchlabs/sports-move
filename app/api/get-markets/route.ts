import { NextResponse } from 'next/server';
import { SportsBettingContract, OnChainMarket } from '@/app/services/SportsBettingContract';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';
  
  try {
    // Get all markets from blockchain
    const allMarkets = await SportsBettingContract.getAllMarkets();
    
    // Apply filter
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
    
    return NextResponse.json({
      markets: filteredMarkets,
      filter: filter.toLowerCase(),
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

