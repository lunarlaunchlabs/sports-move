import { MarketData, ScoreData, SPORT_MARKET_KEY } from '@/app/types';

const API_KEY = "96f436c2212b56604ba2f2ba4f2e5a40";
const BASE_URL = "https://api.the-odds-api.com/v4/sports";

export class TheOddsApi {
  /**
   * Fetch live odds/markets from The Odds API
   * @param sport - The sport key (e.g., SPORT_MARKET_KEY.NFL)
   * @returns Array of market data with bookmaker odds
   */
  static async getMarkets(sport: SPORT_MARKET_KEY): Promise<MarketData[]> {
    const url = `${BASE_URL}/${sport}/odds?regions=us&oddsFormat=american&apiKey=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch markets: ${response.status} - ${errorText}`);
    }
    
    const data: MarketData[] = await response.json();
    return data;
  }

  /**
   * Fetch scores for completed games from The Odds API
   * @param sport - The sport key (e.g., SPORT_MARKET_KEY.NFL)
   * @returns Array of score data for recent games
   */
  static async getScores(sport: SPORT_MARKET_KEY): Promise<ScoreData[]> {
    const url = `${BASE_URL}/${sport}/scores/?daysFrom=1&apiKey=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch scores: ${response.status} - ${errorText}`);
    }
    
    const data: ScoreData[] = await response.json();
    return data;
  }
}
