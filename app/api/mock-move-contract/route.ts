import { NextResponse } from 'next/server';
import { MockMoveContract } from '@/app/services/MockMoveContract';

/**
 * GET /api/mock-move-contract
 * Read data from the Movement smart contract
 * 
 * Query Parameters:
 * - address: The account address to read data from
 * - field (optional): Specific field to read ('message', 'value', or 'isActive')
 * 
 * Example: /api/mock-move-contract?address=0x123...
 * Example: /api/mock-move-contract?address=0x123...&field=message
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const field = searchParams.get('field') as 'message' | 'value' | 'isActive' | null;

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // Check if data store exists for this address
    const hasDataStore = await MockMoveContract.hasDataStore(address);
    
    if (!hasDataStore) {
      return NextResponse.json(
        { 
          error: 'Data store not initialized for this address',
          address,
          initialized: false
        },
        { status: 404 }
      );
    }

    // If specific field is requested, return only that field
    if (field) {
      if (!['message', 'value', 'isActive'].includes(field)) {
        return NextResponse.json(
          { error: 'Invalid field. Must be one of: message, value, isActive' },
          { status: 400 }
        );
      }

      const value = await MockMoveContract.getField(address, field);
      return NextResponse.json({
        address,
        field,
        value
      });
    }

    // Otherwise, return all data
    const data = await MockMoveContract.getData(address);
    
    return NextResponse.json({
      address,
      data,
      initialized: true
    });

  } catch (error) {
    console.error('Error in GET /api/mock-move-contract:', error);
    return NextResponse.json(
      { 
        error: 'Failed to read contract data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mock-move-contract
 * Write data to the Movement smart contract
 * 
 * Request Body:
 * {
 *   "privateKey": "0x...",  // Private key of the account (hex string)
 *   "message": "Hello",     // Message to store
 *   "value": 42            // Numeric value to store
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "transactionHash": "0x...",
 *   "address": "0x...",
 *   "data": { message, value, isActive }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { privateKey, message, value } = body;

    // Validate required fields
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Missing required field: privateKey' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Missing required field: value' },
        { status: 400 }
      );
    }

    // Validate value is a number
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) {
      return NextResponse.json(
        { error: 'Value must be a non-negative number' },
        { status: 400 }
      );
    }

    // Write data to the contract
    const transactionHash = await MockMoveContract.setData(
      privateKey,
      message,
      numericValue
    );

    // Read back the data to confirm
    const { AptosAccount, HexString } = await import('aptos');
    const privateKeyBytes = new HexString(privateKey).toUint8Array();
    const account = new AptosAccount(privateKeyBytes);
    const address = account.address().hex();
    
    const data = await MockMoveContract.getData(address);

    return NextResponse.json({
      success: true,
      transactionHash,
      address,
      data,
      explorerUrl: `https://explorer.movementnetwork.xyz/txn/${transactionHash}?network=testnet`
    });

  } catch (error) {
    console.error('Error in POST /api/mock-move-contract:', error);
    return NextResponse.json(
      { 
        error: 'Failed to write contract data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

