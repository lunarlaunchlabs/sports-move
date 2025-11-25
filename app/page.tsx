'use client';

import { useState, useEffect } from 'react';
import { AptosClient, AptosAccount, HexString } from 'aptos';

// Types
interface Market {
  game_id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odds: string;
  away_odds: string;
  home_odds_positive: boolean;
  away_odds_positive: boolean;
  odds_last_update: string;
  is_resolved: boolean;
  is_cancelled: boolean;
  winning_outcome: string;
}

interface Bet {
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

type MarketFilter = 'all' | 'active' | 'resolved' | 'cancelled';

const NODE_URL = process.env.NEXT_PUBLIC_NODE_URL || 'https://testnet.movementnetwork.xyz/v1';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function SportsBook() {
  // State
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('active');
  const [betFilter, setBetFilter] = useState<MarketFilter>('active');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [betOutcome, setBetOutcome] = useState<'home' | 'away'>('home');
  const [balance, setBalance] = useState<number>(0);

  // Fetch markets
  const fetchMarkets = async () => {
    try {
      console.log("Fetching Markets...")
      const response = await fetch(`/api/get-markets?filter=${marketFilter}`);
      const data = await response.json();
      setMarkets(data.markets || []);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
    }
  };

  // Fetch user bets
  const fetchUserBets = async () => {
    if (!walletAddress) return;
    
    try {
      console.log("Fetching User Bets...")
      const response = await fetch(`/api/get-user-bets?address=${walletAddress}&filter=${betFilter}`);
      const data = await response.json();
      setUserBets(data.bets || []);
    } catch (error) {
      console.error('Failed to fetch user bets:', error);
    }
  };

  // Fetch user balance
  const fetchBalance = async () => {
    if (!walletAddress || !CONTRACT_ADDRESS) return;
    
    try {
      const client = new AptosClient(NODE_URL);
      const balanceResult = await client.view({
        function: `${CONTRACT_ADDRESS}::smusd::balance_of`,
        type_arguments: [],
        arguments: [walletAddress]
      });
      setBalance(parseInt(balanceResult[0] as string) / 100_000_000);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  // Connect wallet
  const connectWallet = () => {
    if (!privateKey) {
      alert('Please enter your private key');
      return;
    }

    try {
      const account = new AptosAccount(new HexString(privateKey).toUint8Array());
      const address = account.address().hex();
      setWalletAddress(address);
      setIsConnected(true);
      alert(`Wallet connected: ${address.slice(0, 10)}...`);
    } catch (error) {
      alert('Invalid private key');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    setPrivateKey('');
    setIsConnected(false);
    setUserBets([]);
    setBalance(0);
  };

  // Place bet
  const placeBet = async () => {
    if (!isConnected || !selectedMarket || !betAmount || !CONTRACT_ADDRESS) {
      alert('Please connect wallet, select a market, and enter bet amount');
      return;
    }

    const amountInSmallestUnit = Math.floor(parseFloat(betAmount) * 100_000_000);
    if (amountInSmallestUnit <= 0) {
      alert('Invalid bet amount');
      return;
    }

    setLoading(true);
    try {
      const account = new AptosAccount(new HexString(privateKey).toUint8Array());
      const client = new AptosClient(NODE_URL);
      
      const outcome = betOutcome === 'home' ? selectedMarket.home_team : selectedMarket.away_team;
      
      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::sports_betting::place_bet`,
        type_arguments: [],
        arguments: [
          selectedMarket.game_id,
          outcome,
          amountInSmallestUnit.toString()
        ]
      };

      const txn = await client.generateTransaction(account.address(), payload);
      const signedTxn = await client.signTransaction(account, txn);
      const result = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(result.hash, { checkSuccess: true });

      alert(`Bet placed successfully! TX: ${result.hash}`);
      setBetAmount('');
      setSelectedMarket(null);
      
      // Refresh data
      await fetchBalance();
      await fetchUserBets();
    } catch (error: any) {
      console.error('Failed to place bet:', error);
      alert(`Failed to place bet: ${error.message || error.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchMarkets();
  }, [marketFilter]);

  useEffect(() => {
    if (isConnected) {
      fetchUserBets();
      fetchBalance();
    }
  }, [betFilter, isConnected, walletAddress]);

  // Format odds display
  const formatOdds = (odds: string, isPositive: boolean) => {
    return isPositive ? `+${odds}` : `-${odds}`;
  };

  // Format timestamp
  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  // Calculate potential payout
  const calculatePotentialPayout = (amount: string, odds: string, isPositive: boolean) => {
    const betAmount = parseFloat(amount);
    const oddsValue = parseFloat(odds);
    
    if (isPositive) {
      return betAmount + (betAmount * oddsValue / 100);
    } else {
      return betAmount + (betAmount * 100 / oddsValue);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Sports Move
          </h1>
          <p className="text-gray-400 text-lg">Decentralized Sports Betting on Movement Network</p>
        </header>

        {/* Wallet Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span>💼</span> Wallet
          </h2>
          
          {!isConnected ? (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2">Private Key (for demo)</label>
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Connected Address</p>
                <p className="font-mono text-lg">{walletAddress.slice(0, 20)}...{walletAddress.slice(-10)}</p>
                <p className="text-green-400 font-semibold mt-2">Balance: {balance.toLocaleString()} smUSD</p>
              </div>
              <button
                onClick={disconnectWallet}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Markets Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span>🏈</span> Markets
                </h2>
                <select
                  value={marketFilter}
                  onChange={(e) => setMarketFilter(e.target.value as MarketFilter)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Markets</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {markets.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No markets found</p>
                ) : (
                  markets.map((market) => (
                    <div
                      key={market.game_id}
                      className={`bg-gray-700 rounded-lg p-4 border transition-all ${
                        selectedMarket?.game_id === market.game_id
                          ? 'border-blue-500 ring-2 ring-blue-500'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">{market.sport_title}</p>
                          <h3 className="font-semibold text-lg">{market.home_team} vs {market.away_team}</h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(market.commence_time)}
                          </p>
                        </div>
                        {market.is_resolved && (
                          <span className="bg-green-600 text-xs px-3 py-1 rounded-full">
                            Resolved: {market.winning_outcome}
                          </span>
                        )}
                        {market.is_cancelled && (
                          <span className="bg-red-600 text-xs px-3 py-1 rounded-full">Cancelled</span>
                        )}
                      </div>

                      {!market.is_resolved && !market.is_cancelled && (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              if (!isConnected) {
                                alert('Please connect your wallet first');
                                return;
                              }
                              setSelectedMarket(market);
                              setBetOutcome('home');
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-3 rounded-lg transition-all transform hover:scale-105"
                          >
                            <p className="text-sm text-gray-300">{market.home_team}</p>
                            <p className="text-xl font-bold">{formatOdds(market.home_odds, market.home_odds_positive)}</p>
                          </button>
                          <button
                            onClick={() => {
                              if (!isConnected) {
                                alert('Please connect your wallet first');
                                return;
                              }
                              setSelectedMarket(market);
                              setBetOutcome('away');
                            }}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 py-3 rounded-lg transition-all transform hover:scale-105"
                          >
                            <p className="text-sm text-gray-300">{market.away_team}</p>
                            <p className="text-xl font-bold">{formatOdds(market.away_odds, market.away_odds_positive)}</p>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Betting Slip & User Bets */}
          <div className="space-y-6">
            {/* Betting Slip */}
            {selectedMarket && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span>🎟️</span> Bet Slip
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Match</p>
                    <p className="font-semibold">{selectedMarket.home_team} vs {selectedMarket.away_team}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Selection</p>
                    <p className="font-semibold text-blue-400">
                      {betOutcome === 'home' ? selectedMarket.home_team : selectedMarket.away_team}
                    </p>
                    <p className="text-lg font-bold">
                      {formatOdds(
                        betOutcome === 'home' ? selectedMarket.home_odds : selectedMarket.away_odds,
                        betOutcome === 'home' ? selectedMarket.home_odds_positive : selectedMarket.away_odds_positive
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Bet Amount (smUSD)</label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="100"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {betAmount && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-400">Potential Payout</p>
                      <p className="text-2xl font-bold text-green-400">
                        {calculatePotentialPayout(
                          betAmount,
                          betOutcome === 'home' ? selectedMarket.home_odds : selectedMarket.away_odds,
                          betOutcome === 'home' ? selectedMarket.home_odds_positive : selectedMarket.away_odds_positive
                        ).toFixed(2)} smUSD
                      </p>
                    </div>
                  )}

                  <button
                    onClick={placeBet}
                    disabled={loading || !betAmount}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Placing Bet...' : 'Place Bet'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMarket(null);
                      setBetAmount('');
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* User Bets */}
            {isConnected && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <span>📊</span> My Bets
                  </h2>
                  <select
                    value={betFilter}
                    onChange={(e) => setBetFilter(e.target.value as MarketFilter)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {userBets.length === 0 ? (
                    <p className="text-gray-400 text-center py-4 text-sm">No bets found</p>
                  ) : (
                    userBets.map((bet) => (
                      <div key={bet.bet_id} className="bg-gray-700 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold">{bet.outcome}</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            bet.is_settled ? 'bg-green-600' : 'bg-blue-600'
                          }`}>
                            {bet.is_settled ? 'Settled' : 'Active'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mb-2">Bet ID: {bet.bet_id}</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Stake:</span>
                          <span className="font-semibold">{(parseInt(bet.amount) / 100_000_000).toFixed(2)} smUSD</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Potential:</span>
                          <span className="font-semibold text-green-400">
                            {(parseInt(bet.potential_payout) / 100_000_000).toFixed(2)} smUSD
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-400">Odds:</span>
                          <span className="font-semibold">
                            {formatOdds(bet.odds, !bet.odds_is_negative)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
