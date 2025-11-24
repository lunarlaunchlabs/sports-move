import { KeyClient, WalletClient } from "@shinami/clients/aptos";
import crypto from 'crypto';

// Hardcoded credentials
const SHINAMI_KEY = 'us1_movement_testnet_bf44be9f0c5b48e9beb0bf0664a3902b';
const WALLET_SECRET_SALT = 'sports-move-shinami-secret-salt-v1';

// Movement Testnet node URL (used for transaction building)
export const MOVEMENT_NODE_URL = 'https://testnet.movementnetwork.xyz/v1';

// Create clients lazily to avoid issues with static initialization
let keyClientInstance: KeyClient | null = null;
let walletClientInstance: WalletClient | null = null;

function getKeyClient(): KeyClient {
  if (!keyClientInstance) {
    keyClientInstance = new KeyClient(SHINAMI_KEY);
  }
  return keyClientInstance;
}

function getWalletClient(): WalletClient {
  if (!walletClientInstance) {
    walletClientInstance = new WalletClient(SHINAMI_KEY);
  }
  return walletClientInstance;
}

export class ShinamiService {
  // Derive deterministic secret from userId
  static deriveSecret(userId: string): string {
    return crypto.createHmac('sha256', WALLET_SECRET_SALT)
      .update(userId).digest('hex');
  }

  // Create session token (valid for 10 minutes)
  static async createSession(userId: string): Promise<string> {
    const secret = this.deriveSecret(userId);
    console.log('Creating session with secret (first 8 chars):', secret.substring(0, 8));
    const token = await getKeyClient().createSession(secret);
    console.log('Session token created (first 8 chars):', token.substring(0, 8));
    return token;
  }

  // Get or create wallet for user
  // Note: getWallet doesn't need sessionToken, only createWallet does
  static async getOrCreateWallet(userId: string): Promise<string> {
    console.log('getOrCreateWallet called with userId:', userId);
    try {
      // First try to get existing wallet (no sessionToken needed)
      console.log('Attempting to get existing wallet...');
      const address = await getWalletClient().getWallet(userId);
      console.log('Found existing wallet:', address.toString());
      
      // Try to initialize on-chain if not already (this is idempotent)
      try {
        const sessionToken = await this.createSession(userId);
        await getWalletClient().initializeWalletOnChain(userId, sessionToken);
        console.log('Wallet initialized on-chain');
      } catch (initError: any) {
        // Wallet might already be on-chain, that's fine
        console.log('initializeWalletOnChain result:', initError?.message || 'already initialized');
      }
      
      return address.toString();
    } catch (error: any) {
      console.log('getWallet failed, attempting to create new wallet. Error:', error?.message);
      // Wallet doesn't exist - create it AND initialize on-chain (needs sessionToken)
      const sessionToken = await this.createSession(userId);
      console.log('Creating new wallet on-chain with walletId:', userId);
      // Use createWalletOnChain to create and initialize in one step
      const address = await getWalletClient().createWalletOnChain(userId, sessionToken);
      console.log('Created new wallet on-chain:', address.toString());
      return address.toString();
    }
  }

  // Execute gasless transaction
  // Returns PendingTransactionResponse from SDK
  static async executeTransaction(
    userId: string,
    transaction: any
  ): Promise<{ hash: string }> {
    const sessionToken = await this.createSession(userId);
    // SDK returns PendingTransactionResponse directly (not wrapped)
    const pendingTx = await getWalletClient().executeGaslessTransaction(
      userId, sessionToken, transaction
    );
    return { hash: pendingTx.hash };
  }
}
