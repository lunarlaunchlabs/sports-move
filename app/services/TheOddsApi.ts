import mockData from './mocks/mock-markets.json';
import mockScores from './mocks/mock-scores.json';

export class TheOddsApi {
  static async getMarkets(sport: string | null) {
    console.log('sport:', sport);
    return Promise.resolve(mockData);
  }

  static async getScores(sport: string | null) {
    console.log('sport:', sport);
    return Promise.resolve(mockScores);
  }
}

