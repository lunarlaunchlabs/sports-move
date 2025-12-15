import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { ShinamiService } from '@/app/services/ShinamiService';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Movement Testnet configuration
const MOVEMENT_NODE_URL = 'https://testnet.movementnetwork.xyz/v1';

// Create Aptos client configured for Movement Testnet
const aptosConfig = new AptosConfig({ 
  network: Network.CUSTOM,
  fullnode: MOVEMENT_NODE_URL,
});
const aptos = new Aptos(aptosConfig);

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { functionName, typeArguments, functionArguments } = await request.json();

  try {
    const walletAddress = await ShinamiService.getOrCreateWallet(userId);
    
    console.log('Building transaction:', {
      sender: walletAddress,
      function: functionName,
      typeArguments,
      functionArguments,
    });
    
    // Build transaction using Movement Testnet node
    const transaction = await aptos.transaction.build.simple({
      sender: walletAddress,
      data: { 
        function: functionName, 
        typeArguments: typeArguments || [], 
        functionArguments: functionArguments || [] 
      }
    });

    console.log('Transaction built, executing via Shinami...');
    const result = await ShinamiService.executeTransaction(userId, transaction);
    console.log('Transaction executed:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Execute transaction error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
