import { NextResponse } from 'next/server';
import { AptosClient } from 'aptos';

// Movement Testnet (Fresh Deployment)
const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';

const client = new AptosClient(NODE_URL);

interface Bet {
  bet_id: string;
  user: string;
  game_id: string;
  outcome: string;
  amount: string;
  odds: string;
  odds_positive: boolean; // true = positive odds (+), false = negative odds (-)
  potential_payout: string;
  is_settled: boolean;
  timestamp: string;
}

interface Market {
  game_id: string;
  is_resolved: boolean;
  is_cancelled: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const filter = searchParams.get('filter') || 'all';
  
  // Validate required address parameter
  if (!address) {
    return NextResponse.json(
      { 
        error: 'Address parameter is required',
        example: '/api/get-user-bets?address=0x123...'
      },
      { status: 400 }
    );
  }
  
  // Basic address validation
  if (!address.startsWith('0x') || address.length < 10) {
    return NextResponse.json(
      { 
        error: 'Invalid address format',
        details: 'Address must start with 0x and be a valid hex string'
      },
      { status: 400 }
    );
  }
  
  try {
    // Get user bets from blockchain
    const userBets = await client.view({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_user_bets`,
      type_arguments: [],
      arguments: [address]
    });
    
    const bets = userBets[0] as Bet[];
    
    if (!bets || bets.length === 0) {
      return NextResponse.json({
        address,
        bets: [],
        filter: filter.toLowerCase(),
        count: 0,
        message: 'No bets found for this address'
      });
    }
    
    // Get all markets to determine bet status
    const allMarkets = await client.view({
      function: `${CONTRACT_ADDRESS}::sports_betting::get_markets`,
      type_arguments: [],
      arguments: []
    });
    
    const markets = allMarkets[0] as Market[];
    
    // Create a map for quick market lookup
    const marketMap = new Map<string, Market>();
    markets.forEach(market => {
      marketMap.set(market.game_id, market);
    });
    
    // Filter bets based on market status
    let filteredBets: Bet[];
    
    switch (filter.toLowerCase()) {
      case 'active':
        // Active: market is not resolved and not cancelled
        filteredBets = bets.filter(bet => {
          const market = marketMap.get(bet.game_id);
          return market && !market.is_resolved && !market.is_cancelled;
        });
        break;
        
      case 'resolved':
        // Resolved: market is resolved (and not cancelled)
        filteredBets = bets.filter(bet => {
          const market = marketMap.get(bet.game_id);
          return market && market.is_resolved && !market.is_cancelled;
        });
        break;
        
      case 'cancelled':
        // Cancelled: market is cancelled
        filteredBets = bets.filter(bet => {
          const market = marketMap.get(bet.game_id);
          return market && market.is_cancelled;
        });
        break;
        
      case 'all':
      default:
        // All bets
        filteredBets = bets;
        break;
    }
    
    return NextResponse.json({
      address,
      bets: filteredBets,
      filter: filter.toLowerCase(),
      count: filteredBets.length,
      total: bets.length
    });
  } catch (error: any) {
    console.error('Error fetching user bets:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user bets', 
        details: error.message,
        address,
        bets: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

