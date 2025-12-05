import mockData from './mocks/mock-markets.json';
import mockScores from './mocks/mock-scores.json';
import { MarketData, ScoreData } from '@/app/types';

const API_KEY = "96f436c2212b56604ba2f2ba4f2e5a40"

export class TheOddsApi {
  static async getMarkets(sport: string | null): Promise<MarketData[]> {
    console.log('sport:', sport);
    return Promise.resolve(mockData as MarketData[]);
  }

  static async getScores(sport: string | null): Promise<ScoreData[]> {
    console.log('sport:', sport);
    return Promise.resolve(mockScores as ScoreData[]);
  }
}

