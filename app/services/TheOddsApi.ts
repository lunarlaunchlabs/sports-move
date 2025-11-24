import mockData from './mock.json';

export class TheOddsApi {
  static async getMarkets(sport: string | null) {
    console.log('sport:', sport);
    return Promise.resolve(mockData);
  }
}

