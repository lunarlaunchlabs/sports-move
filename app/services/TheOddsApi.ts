import mockData from './mocks/mock-markets.json';
import mockScores from './mocks/mock-scores.json';
import { MarketData, ScoreData } from '@/app/types';

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

