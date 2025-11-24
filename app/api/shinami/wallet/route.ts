import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { ShinamiService } from '@/app/services/ShinamiService';

export async function POST() {
  try {
    const { userId } = await auth();
    console.log('Shinami wallet route - userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const address = await ShinamiService.getOrCreateWallet(userId);
    console.log('Shinami wallet created/retrieved:', address);
    return NextResponse.json({ address });
  } catch (error: any) {
    console.error('Shinami wallet error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Extract meaningful error message
    const errorMessage = error?.message || error?.toString() || 'Unknown Shinami error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
