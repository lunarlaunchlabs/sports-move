import { NextRequest, NextResponse } from 'next/server';
import { SportsBettingContract } from '@/app/services/SportsBettingContract';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, amount } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Limit maximum mint amount to prevent abuse (1000 smUSD per request)
    const maxAmount = 1000;
    if (amount > maxAmount) {
      return NextResponse.json(
        { error: `Maximum mint amount is ${maxAmount} smUSD` },
        { status: 400 }
      );
    }

    const txHash = await SportsBettingContract.mintSmUSD(address, amount);

    return NextResponse.json({
      success: true,
      txHash,
      message: `Successfully minted ${amount} smUSD to ${address}`,
    });
  } catch (error: any) {
    console.error('Error in mint-smusd API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mint smUSD' },
      { status: 500 }
    );
  }
}

