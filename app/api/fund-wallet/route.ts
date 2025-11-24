import { NextRequest, NextResponse } from 'next/server';

const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const FAUCET_URL = 'https://faucet.testnet.movementnetwork.xyz';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Validate address format (0x followed by 64 hex characters)
    if (!address.startsWith('0x') || address.length !== 66) {
      return NextResponse.json(
        { error: 'Invalid wallet address format. Must be 0x followed by 64 hex characters.' },
        { status: 400 }
      );
    }

    // Import FaucetClient dynamically to avoid issues with server-side rendering
    const { FaucetClient } = await import('aptos');
    const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

    // Fund the account with 1 MOVE (100_000_000 octas)
    await faucetClient.fundAccount(address, 100_000_000);

    return NextResponse.json({
      success: true,
      message: `Successfully funded ${address} with 1 MOVE`,
      amount: '1 MOVE',
    });
  } catch (error: any) {
    console.error('Error in fund-wallet API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fund wallet' },
      { status: 500 }
    );
  }
}
