// Types for The Odds API responses

// Market Types
export interface Outcome {
  name: string;
  price: number;
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface MarketData {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

// Score Types
export interface Score {
  name: string;
  score: string;
}

export interface ScoreData {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: Score[];
  last_update: string;
}

export enum SPORT_KEY {
  ALL = 0,
  NFL = "americanfootball_nfl",
  NBA = "basketball_nba",
  NHL = "icehockey_nhl",
  MLB = "baseball_mlb",
}