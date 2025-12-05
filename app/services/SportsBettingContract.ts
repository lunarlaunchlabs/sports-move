import { AptosClient, AptosAccount, HexString } from 'aptos';
import { MarketData, ScoreData } from '@/app/types';

// Contract configuration - Movement Testnet (Fresh Deployment)
const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';
const ADMIN1_PRIVATE_KEY = '0x8424863dda9e0238cea0c8c6d2c79de9b3778bb54983b5202dbbd29982c29fa9';

// Initialize Aptos client for Movement Network
const client = new AptosClient(NODE_URL);

export interface OnChainMarket {
  game_id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: number;
  home_odds: number;
  away_odds: number;
  home_odds_is_negative: boolean;
  away_odds_is_negative: boolean;
  is_resolved: boolean;
  is_cancelled: boolean;
  winning_outcome: string;
}

export interface OnChainBet {
  bet_id: string;
  user: string;
  game_id: string;
  outcome: string;
  amount: string;
  odds: string;
  odds_is_negative: boolean;
  potential_payout: string;
  is_settled: boolean;
  timestamp: string;
}

export class SportsBettingContract {
  /**
   * Create a market on the blockchain from API data
   */
  static async createMarket(market: MarketData): Promise<string> {
    try {
      const admin = new AptosAccount(new HexString(ADMIN1_PRIVATE_KEY).toUint8Array());
      
      // Find FanDuel bookmaker odds
      const fanDuelBookmaker = market.bookmakers.find(b => b.key === 'fanduel');
      if (!fanDuelBookmaker) {
        throw new Error('FanDuel bookmaker not found');
      }

      // Get h2h (head-to-head) market odds
      const h2hMarket = fanDuelBookmaker.markets.find(m => m.key === 'h2h');
      if (!h2hMarket || h2hMarket.outcomes.length < 2) {
        throw new Error('H2H market or outcomes not found');
      }

      // Extract home and away odds
      const homeOutcome = h2hMarket.outcomes.find(o => o.name === market.home_team);
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === market.away_team);

      if (!homeOutcome || !awayOutcome) {
        throw new Error('Could not find odds for both teams');
      }

      // Convert American odds to our format (u64 + boolean)
      const homeOdds = Math.abs(homeOutcome.price);
      const homeOddsIsPositive = homeOutcome.price > 0;
      const awayOdds = Math.abs(awayOutcome.price);
      const awayOddsIsPositive = awayOutcome.price > 0;

      // Convert commence_time to unix timestamp
      const commenceTime = Math.floor(new Date(market.commence_time).getTime() / 1000);

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::sports_betting::create_market`,
        type_arguments: [],
        arguments: [
          market.id,                    // game_id
          market.sport_key,             // sport_key
          market.sport_title,           // sport_title
          market.home_team,             // home_team
          market.away_team,             // away_team
          commenceTime.toString(),      // commence_time
          homeOdds.toString(),          // home_odds
          homeOddsIsPositive,           // home_odds_positive
          awayOdds.toString(),          // away_odds
          awayOddsIsPositive            // away_odds_positive
        ]
      };

      const txn = await client.generateTransaction(admin.address(), payload);
      const signedTxn = await client.signTransaction(admin, txn);
      const result = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error: any) {
      // If market already exists, try to update odds instead
      if (error.message?.includes('EMARKET_ALREADY_EXISTS')) {
        return await this.updateMarketOdds(market);
      }
      console.error('Error creating market:', error);
      throw new Error(`Failed to create market: ${error.message}`);
    }
  }

  /**
   * Update market odds on the blockchain
   */
  static async updateMarketOdds(market: MarketData): Promise<string> {
    try {
      const admin = new AptosAccount(new HexString(ADMIN1_PRIVATE_KEY).toUint8Array());
      
      // Find FanDuel bookmaker odds
      const fanDuelBookmaker = market.bookmakers.find(b => b.key === 'fanduel');
      if (!fanDuelBookmaker) {
        throw new Error('FanDuel bookmaker not found');
      }

      const h2hMarket = fanDuelBookmaker.markets.find(m => m.key === 'h2h');
      if (!h2hMarket || h2hMarket.outcomes.length < 2) {
        throw new Error('H2H market or outcomes not found');
      }

      const homeOutcome = h2hMarket.outcomes.find(o => o.name === market.home_team);
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === market.away_team);

      if (!homeOutcome || !awayOutcome) {
        throw new Error('Could not find odds for both teams');
      }

      const homeOdds = Math.abs(homeOutcome.price);
      const homeOddsIsPositive = homeOutcome.price > 0;
      const awayOdds = Math.abs(awayOutcome.price);
      const awayOddsIsPositive = awayOutcome.price > 0;

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::sports_betting::update_market_odds`,
        type_arguments: [],
        arguments: [
          market.id,                // game_id
          homeOdds.toString(),      // home_odds
          homeOddsIsPositive,       // home_odds_positive
          awayOdds.toString(),      // away_odds
          awayOddsIsPositive        // away_odds_positive
        ]
      };

      const txn = await client.generateTransaction(admin.address(), payload);
      const signedTxn = await client.signTransaction(admin, txn);
      const result = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error: any) {
      console.error('Error updating market odds:', error);
      throw new Error(`Failed to update market odds: ${error.message}`);
    }
  }

  /**
   * Resolve a market based on score data
   */
  static async resolveMarket(score: ScoreData): Promise<string> {
    try {
      const admin = new AptosAccount(new HexString(ADMIN1_PRIVATE_KEY).toUint8Array());
      
      // Determine winning team
      let winningOutcome: string;
      
      if (score.scores && score.scores.length === 2) {
        const homeScore = score.scores.find(s => s.name === score.home_team);
        const awayScore = score.scores.find(s => s.name === score.away_team);

        if (!homeScore || !awayScore) {
          throw new Error('Could not find scores for both teams');
        }

        const homeScoreNum = parseInt(homeScore.score);
        const awayScoreNum = parseInt(awayScore.score);

        if (homeScoreNum > awayScoreNum) {
          winningOutcome = score.home_team;
        } else if (awayScoreNum > homeScoreNum) {
          winningOutcome = score.away_team;
        } else {
          // In case of a tie, we might want to cancel the market
          return await this.cancelMarket(score.id);
        }
      } else {
        throw new Error('Invalid score data');
      }

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::sports_betting::resolve_market`,
        type_arguments: [],
        arguments: [
          score.id,        // game_id
          winningOutcome   // winning_outcome
        ]
      };

      const txn = await client.generateTransaction(admin.address(), payload);
      const signedTxn = await client.signTransaction(admin, txn);
      const result = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error: any) {
      console.error('Error resolving market:', error);
      throw new Error(`Failed to resolve market: ${error.message}`);
    }
  }

  /**
   * Cancel a market and trigger refunds
   */
  static async cancelMarket(gameId: string): Promise<string> {
    try {
      const admin = new AptosAccount(new HexString(ADMIN1_PRIVATE_KEY).toUint8Array());

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::sports_betting::cancel_market`,
        type_arguments: [],
        arguments: [gameId]
      };

      const txn = await client.generateTransaction(admin.address(), payload);
      const signedTxn = await client.signTransaction(admin, txn);
      const result = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error: any) {
      console.error('Error cancelling market:', error);
      throw new Error(`Failed to cancel market: ${error.message}`);
    }
  }

  /**
   * Settle bets for a resolved market
   */
  static async settleBets(gameId: string): Promise<string> {
    try {
      const admin = new AptosAccount(new HexString(ADMIN1_PRIVATE_KEY).toUint8Array());

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::sports_betting::settle_bets`,
        type_arguments: [],
        arguments: [gameId]
      };

      const txn = await client.generateTransaction(admin.address(), payload);
      const signedTxn = await client.signTransaction(admin, txn);
      const result = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error: any) {
      console.error('Error settling bets:', error);
      throw new Error(`Failed to settle bets: ${error.message}`);
    }
  }

  /**
   * Get all markets from the blockchain
   */
  static async getAllMarkets(): Promise<OnChainMarket[]> {
    try {
      const markets = await client.view({
        function: `${CONTRACT_ADDRESS}::sports_betting::get_markets`,
        type_arguments: [],
        arguments: []
      });

      return markets[0] as OnChainMarket[];
    } catch (error: any) {
      console.error('Error getting markets:', error);
      return [];
    }
  }

  /**
   * Get a specific market from the blockchain
   */
  static async getMarket(gameId: string): Promise<OnChainMarket | null> {
    try {
      const market = await client.view({
        function: `${CONTRACT_ADDRESS}::sports_betting::get_market`,
        type_arguments: [],
        arguments: [gameId]
      });

      return market[0] as OnChainMarket;
    } catch (error: any) {
      console.error('Error getting market:', error);
      return null;
    }
  }

  /**
   * Mint smUSD tokens to an address (testnet faucet)
   * This uses the admin key to mint tokens for testing purposes
   */
  static async mintSmUSD(toAddress: string, amount: number): Promise<string> {
    try {
      const admin = new AptosAccount(new HexString(ADMIN1_PRIVATE_KEY).toUint8Array());
      
      // Convert amount to smallest unit (8 decimals)
      const amountInSmallestUnit = Math.floor(amount * 100_000_000);

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::smusd::mint`,
        type_arguments: [],
        arguments: [
          toAddress,                     // to: address
          amountInSmallestUnit.toString() // amount: u64
        ]
      };

      const txn = await client.generateTransaction(admin.address(), payload);
      const signedTxn = await client.signTransaction(admin, txn);
      const result = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(result.hash);

      return result.hash;
    } catch (error: any) {
      console.error('Error minting smUSD:', error);
      throw new Error(`Failed to mint smUSD: ${error.message}`);
    }
  }

  /**
   * Get smUSD balance for an address
   */
  static async getSmUsdBalance(address: string): Promise<number> {
    try {
      const result = await client.view({
        function: `${CONTRACT_ADDRESS}::smusd::balance_of`,
        type_arguments: [],
        arguments: [address]
      });

      // Convert from smallest unit (8 decimals) to human readable
      return Number(result[0]) / 100_000_000;
    } catch (error: any) {
      console.error('Error getting smUSD balance:', error);
      return 0;
    }
  }
}

