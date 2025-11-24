# API Integration Guide

This guide shows how to integrate the Move smart contracts with your existing Next.js API routes.

## Prerequisites

1. Install Aptos SDK:
```bash
npm install @aptos-labs/ts-sdk
```

2. Set up environment variables:
```env
ADMIN_PRIVATE_KEY=0x... # Admin wallet private key
CONTRACT_ADDRESS=0x... # Sports betting contract address
NETWORK=testnet # or mainnet
```

## API Service for Contract Interaction

Create a service to interact with the contracts:

```typescript
// app/services/ContractService.ts
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

export class ContractService {
  private aptos: Aptos;
  private admin: Account;
  private contractAddress: string;

  constructor() {
    const config = new AptosConfig({ 
      network: process.env.NETWORK as Network 
    });
    this.aptos = new Aptos(config);
    
    // Initialize admin account
    const privateKey = new Ed25519PrivateKey(process.env.ADMIN_PRIVATE_KEY!);
    this.admin = Account.fromPrivateKey({ privateKey });
    
    this.contractAddress = process.env.CONTRACT_ADDRESS!;
  }

  // Create a betting market
  async createMarket(marketData: {
    id: string;
    sport_key: string;
    home_team: string;
    away_team: string;
    commence_time: string;
  }) {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.admin.accountAddress,
      data: {
        function: `${this.contractAddress}::sports_betting::create_market`,
        functionArguments: [
          marketData.id,
          marketData.sport_key,
          marketData.home_team,
          marketData.away_team,
          Math.floor(new Date(marketData.commence_time).getTime() / 1000),
        ],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.admin,
      transaction,
    });

    await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return committedTxn.hash;
  }

  // Resolve a market
  async resolveMarket(gameId: string, winningTeam: string) {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.admin.accountAddress,
      data: {
        function: `${this.contractAddress}::sports_betting::resolve_market`,
        functionArguments: [gameId, winningTeam],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.admin,
      transaction,
    });

    await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return committedTxn.hash;
  }

  // Settle bets for a market
  async settleBets(gameId: string) {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.admin.accountAddress,
      data: {
        function: `${this.contractAddress}::sports_betting::settle_bets`,
        functionArguments: [gameId],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.admin,
      transaction,
    });

    await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return committedTxn.hash;
  }

  // Cancel a market
  async cancelMarket(gameId: string) {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.admin.accountAddress,
      data: {
        function: `${this.contractAddress}::sports_betting::cancel_market`,
        functionArguments: [gameId],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.admin,
      transaction,
    });

    await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return committedTxn.hash;
  }

  // Get all markets (view function)
  async getMarkets() {
    const result = await this.aptos.view({
      payload: {
        function: `${this.contractAddress}::sports_betting::get_markets`,
        functionArguments: [],
      },
    });

    return result;
  }

  // Get user bets (view function)
  async getUserBets(userAddress: string) {
    const result = await this.aptos.view({
      payload: {
        function: `${this.contractAddress}::sports_betting::get_user_bets`,
        functionArguments: [userAddress],
      },
    });

    return result;
  }

  // Mint smUSD for testing/funding
  async mintSmUSD(toAddress: string, amount: number) {
    const transaction = await this.aptos.transaction.build.simple({
      sender: this.admin.accountAddress,
      data: {
        function: `${this.contractAddress}::smusd::mint`,
        functionArguments: [toAddress, amount],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: this.admin,
      transaction,
    });

    await this.aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    return committedTxn.hash;
  }
}
```

## Update Existing API Routes

### Markets API Route

Update `/app/api/markets/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ContractService } from '@/app/services/ContractService';
import { TheOddsApi } from '@/app/services/TheOddsApi';

const contractService = new ContractService();
const oddsApi = new TheOddsApi();

export async function GET(request: NextRequest) {
  try {
    // Option 1: Get from blockchain
    const markets = await contractService.getMarkets();
    return NextResponse.json(markets);
    
    // Option 2: Get from API and sync to blockchain
    // const apiMarkets = await oddsApi.getMarkets();
    // return NextResponse.json(apiMarkets);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'sync') {
      // Fetch from The Odds API and sync to blockchain
      const apiMarkets = await oddsApi.getMarkets();
      
      for (const market of apiMarkets) {
        await contractService.createMarket({
          id: market.id,
          sport_key: market.sport_key,
          home_team: market.home_team,
          away_team: market.away_team,
          commence_time: market.commence_time,
        });
      }

      return NextResponse.json({ 
        success: true, 
        synced: apiMarkets.length 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to sync markets' },
      { status: 500 }
    );
  }
}
```

### Scores API Route

Update `/app/api/scores/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ContractService } from '@/app/services/ContractService';
import { TheOddsApi } from '@/app/services/TheOddsApi';

const contractService = new ContractService();
const oddsApi = new TheOddsApi();

export async function GET(request: NextRequest) {
  try {
    // Fetch scores from The Odds API
    const scores = await oddsApi.getScores();
    return NextResponse.json(scores);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'resolve') {
      // Fetch completed games and resolve markets
      const scores = await oddsApi.getScores();
      const completedGames = scores.filter((s: any) => s.completed);

      for (const game of completedGames) {
        // Determine winner
        const homeScore = parseInt(game.scores.find((s: any) => s.name === game.home_team)?.score || '0');
        const awayScore = parseInt(game.scores.find((s: any) => s.name === game.away_team)?.score || '0');
        const winner = homeScore > awayScore ? game.home_team : game.away_team;

        // Resolve market on blockchain
        await contractService.resolveMarket(game.id, winner);
        
        // Settle bets
        await contractService.settleBets(game.id);
      }

      return NextResponse.json({ 
        success: true, 
        resolved: completedGames.length 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to resolve markets' },
      { status: 500 }
    );
  }
}
```

### New Bets API Route

Create `/app/api/bets/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ContractService } from '@/app/services/ContractService';

const contractService = new ContractService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('user');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address required' },
        { status: 400 }
      );
    }

    const bets = await contractService.getUserBets(userAddress);
    return NextResponse.json(bets);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    );
  }
}
```

### Fund User Wallet Route

Create `/app/api/fund/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ContractService } from '@/app/services/ContractService';

const contractService = new ContractService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, amount } = body;

    if (!address || !amount) {
      return NextResponse.json(
        { error: 'Address and amount required' },
        { status: 400 }
      );
    }

    // Mint smUSD to user (amount in base units with 8 decimals)
    const amountInBaseUnits = Math.floor(amount * 100000000);
    const txHash = await contractService.mintSmUSD(address, amountInBaseUnits);

    return NextResponse.json({ 
      success: true, 
      transactionHash: txHash,
      amount: amountInBaseUnits 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fund wallet' },
      { status: 500 }
    );
  }
}
```

## Cron Job Setup

### Using Vercel Cron Jobs

Create `/app/api/cron/settle-bets/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ContractService } from '@/app/services/ContractService';
import { TheOddsApi } from '@/app/services/TheOddsApi';

const contractService = new ContractService();
const oddsApi = new TheOddsApi();

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch completed games
    const scores = await oddsApi.getScores();
    const completedGames = scores.filter((s: any) => s.completed);

    let resolved = 0;
    let settled = 0;

    for (const game of completedGames) {
      try {
        // Check if already resolved
        const markets = await contractService.getMarkets();
        const market = markets.find((m: any) => m.game_id === game.id);
        
        if (!market) continue;
        if (market.is_resolved) {
          // Already resolved, just settle
          await contractService.settleBets(game.id);
          settled++;
        } else {
          // Determine winner and resolve
          const homeScore = parseInt(game.scores.find((s: any) => s.name === game.home_team)?.score || '0');
          const awayScore = parseInt(game.scores.find((s: any) => s.name === game.away_team)?.score || '0');
          const winner = homeScore > awayScore ? game.home_team : game.away_team;

          await contractService.resolveMarket(game.id, winner);
          resolved++;
          
          // Settle bets
          await contractService.settleBets(game.id);
          settled++;
        }
      } catch (error) {
        console.error(`Failed to process game ${game.id}:`, error);
        continue;
      }
    }

    return NextResponse.json({ 
      success: true,
      resolved,
      settled,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/settle-bets",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Frontend Integration

### Place Bet Component

```typescript
// app/components/PlaceBet.tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export function PlaceBet({ gameId, outcome, odds }: { 
  gameId: string; 
  outcome: string; 
  odds: number; 
}) {
  const { account, signAndSubmitTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceBet = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      // Convert amount to base units (8 decimals)
      const amountInBaseUnits = Math.floor(parseFloat(amount) * 100000000);
      
      const response = await signAndSubmitTransaction({
        data: {
          function: `${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}::sports_betting::place_bet`,
          functionArguments: [gameId, outcome, amountInBaseUnits, odds],
        },
      });

      console.log('Bet placed:', response);
      alert('Bet placed successfully!');
    } catch (error) {
      console.error('Failed to place bet:', error);
      alert('Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Bet amount (smUSD)"
        disabled={loading}
      />
      <button onClick={handlePlaceBet} disabled={loading || !account}>
        {loading ? 'Placing...' : 'Place Bet'}
      </button>
    </div>
  );
}
```

## Testing the Integration

1. **Sync markets from API to blockchain:**
```bash
curl -X POST http://localhost:3000/api/markets \
  -H "Content-Type: application/json" \
  -d '{"action":"sync"}'
```

2. **Resolve completed games:**
```bash
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -d '{"action":"resolve"}'
```

3. **Fund a user wallet:**
```bash
curl -X POST http://localhost:3000/api/fund \
  -H "Content-Type: application/json" \
  -d '{"address":"0x123...", "amount":100}'
```

4. **Get user bets:**
```bash
curl http://localhost:3000/api/bets?user=0x123...
```

## Summary

This integration:
- ✅ Syncs markets from The Odds API to blockchain
- ✅ Automatically resolves and settles bets via cron job
- ✅ Provides API endpoints for frontend
- ✅ Handles user wallet funding
- ✅ Supports bet placement from UI
- ✅ Manages admin operations securely

