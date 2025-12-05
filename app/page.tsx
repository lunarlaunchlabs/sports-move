'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { FaFootballBall, FaBasketballBall, FaBaseballBall, FaHockeyPuck, FaFutbol, FaLink, FaMoneyBillWave, FaTint, FaLock, FaDice } from 'react-icons/fa';
import { FaMoneyBill1Wave } from 'react-icons/fa6';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import Confetti from 'react-confetti';

/**
 * Main App Color: #000000
 * Highlight Color (Logo Text Color): #F5B400
 * Text Color: #FFFFFF
 */

// Contract configuration - Movement Testnet (Fresh Deployment)
const CONTRACT_ADDRESS = '0xc90dabb5730415a099ff16d8edf5a3a350ff28d3183e2ecb80182312cc99d5cb';
const NODE_URL = 'https://testnet.movementnetwork.xyz/v1';

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

type MarketFilter = 'all' | 'active' | 'resolved' | 'cancelled';
type SportFilter = 'all' | 'nfl' | 'nhl' | 'mlb' | 'nba';
type DateSort = 'soonest' | 'latest';

interface BetSelection {
  market: Market;
  outcome: 'home' | 'away';
  teamName: string;
  odds: string;
  oddsPositive: boolean;
}

interface Bet {
  bet_id: string;
  user: string;
  game_id: string;
  outcome: string;
  amount: string;
  odds: string;
  odds_positive: boolean; // true = positive odds (+), false = negative odds (-)
  potential_payout: string;
  is_settled: boolean;
  timestamp: string;
}

type BetFilter = 'all' | 'active' | 'resolved' | 'cancelled';
type BetViewMode = 'table' | 'tiles';

const betFilterOptions: { key: BetFilter; label: string }[] = [
  { key: 'all', label: 'All Bets' },
  { key: 'active', label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'cancelled', label: 'Cancelled' },
];

const MARKETS_PER_PAGE = 10;

const marketFilterTabs: { key: MarketFilter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'cancelled', label: 'Cancelled' },
];

const sportTabs: { key: SportFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: null },
  { key: 'nfl', label: 'NFL', icon: <FaFootballBall className="w-4 h-4" /> },
  { key: 'nhl', label: 'NHL', icon: <FaHockeyPuck className="w-4 h-4" /> },
  { key: 'mlb', label: 'MLB', icon: <FaBaseballBall className="w-4 h-4" /> },
  { key: 'nba', label: 'NBA', icon: <FaBasketballBall className="w-4 h-4" /> },
];

// Helper function to get sport icon by sport key
function getSportIcon(sportKey: string): React.ReactNode {
  const key = sportKey.toLowerCase();
  if (key.includes('football') || key.includes('nfl')) return <FaFootballBall className="w-3.5 h-3.5" />;
  if (key.includes('basketball') || key.includes('nba')) return <FaBasketballBall className="w-3.5 h-3.5" />;
  if (key.includes('hockey') || key.includes('nhl')) return <FaHockeyPuck className="w-3.5 h-3.5" />;
  if (key.includes('baseball') || key.includes('mlb')) return <FaBaseballBall className="w-3.5 h-3.5" />;
  return null;
}

const dateSortOptions: { key: DateSort; label: string }[] = [
  { key: 'soonest', label: 'Soonest First' },
  { key: 'latest', label: 'Latest First' },
];

interface NavBarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  walletAddress: string | null;
  smUsdBalance: number | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

function NavBar({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  walletAddress, 
  smUsdBalance,
  onConnect,
  onDisconnect 
}: NavBarProps) {
  const navLinks = [
    { label: 'Markets', href: '#markets' },
    { label: 'My Bets', href: '#my-bets' },
    { label: 'Faucet', href: '#faucet' },
    { label: 'How It Works', href: '#how-it-works' },
  ];

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <nav className="bg-black border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="shrink-0">
            <a href="/" className="flex items-center">
              <Image
                src="/SPORTS_MOVE_LOGO.png"
                alt="Sports Move Logo"
                width={180}
                height={40}
                className="h-8 w-auto sm:h-10"
                priority
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-white hover:text-[#F5B400] transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
            
            {walletAddress ? (
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2">
                  <span className="text-[#F5B400] font-semibold">
                    {smUsdBalance !== null ? `${formatBalance(smUsdBalance)} smUSD` : '...'}
                  </span>
                </div>
                <button 
                  onClick={onDisconnect}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="text-zinc-400">{truncateAddress(walletAddress)}</span>
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={onConnect}
                className="bg-[#F5B400] hover:bg-[#d9a000] text-black font-semibold px-5 py-2 rounded-lg transition-colors duration-200"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-[#F5B400] p-2 rounded-lg transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-80 pb-4' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col space-y-3 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-white hover:text-[#F5B400] transition-colors duration-200 font-medium py-2 px-2 rounded-lg hover:bg-zinc-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            
            {walletAddress ? (
              <div className="space-y-2 pt-2">
                <div className="bg-zinc-800 rounded-lg px-4 py-3 text-center">
                  <p className="text-[#F5B400] font-semibold text-lg">
                    {smUsdBalance !== null ? `${formatBalance(smUsdBalance)} smUSD` : '...'}
                  </p>
                  <p className="text-zinc-400 text-sm">{truncateAddress(walletAddress)}</p>
                </div>
                <button 
                  onClick={() => {
                    onDisconnect();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium px-5 py-3 rounded-lg transition-colors duration-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  onConnect();
                  setIsMobileMenuOpen(false);
                }}
                className="bg-[#F5B400] hover:bg-[#d9a000] text-black font-semibold px-5 py-3 rounded-lg transition-colors duration-200 mt-2"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Hero Component
interface HeroProps {
  isConnected: boolean;
  onConnect: () => void;
}

function Hero({ isConnected, onConnect }: HeroProps) {
  return (
    <section className="py-12 sm:py-20 text-center relative overflow-hidden rounded-2xl bg-zinc-950/50">
      {/* Animated Sports Icons Background */}
      <SportsIconsBackground />
      
      {/* Hero Content */}
      <div className="relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          Bet on Sports with{' '}
          <span className="text-[#F5B400]">Movement</span>
        </h1>
        <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
          Decentralized sports betting powered by the Movement Network.
          Fast, transparent, and secure.
        </p>
        {!isConnected && (
          <button 
            onClick={onConnect}
            className="bg-[#F5B400] hover:bg-[#d9a000] text-black font-semibold px-8 py-3 rounded-lg text-lg transition-colors duration-200"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </section>
  );
}

// Sports Icons Background Component
function SportsIconsBackground() {
  const icons = [
    { Icon: FaFootballBall, color: 'rgba(255,255,255,0.15)' },
    { Icon: FaBasketballBall, color: 'rgba(255,255,255,0.15)' },
    { Icon: FaBaseballBall, color: 'rgba(245,180,0,0.15)' },
    { Icon: FaHockeyPuck, color: 'rgba(245,180,0,0.15)' },
    { Icon: FaFutbol, color: 'rgba(255,255,255,0.15)' },
  ];

  // Create a 2x2 tile that repeats seamlessly
  const tileSize = 80;
  const cols = 28;
  const rows = 16;

  const patternGrid = Array.from({ length: rows * cols }).map((_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    // Use 2x2 pattern so it tiles perfectly with 160px animation
    const iconIndex = ((row % 2) * 2 + (col % 2)) % icons.length;
    const { Icon, color } = icons[iconIndex];
    const rotation = ((row * 7 + col * 13) * 15) % 360;

    return (
      <div
        key={i}
        className="absolute flex items-center justify-center"
        style={{
          width: tileSize,
          height: tileSize,
          left: col * tileSize,
          top: row * tileSize,
        }}
      >
        <Icon size={24} color={color} style={{ transform: `rotate(${rotation}deg)` }} />
      </div>
    );
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute animate-sports-scroll"
        style={{ 
          width: cols * tileSize, 
          height: rows * tileSize,
          left: -tileSize * 2,
          top: -tileSize * 2,
        }}
      >
        {patternGrid}
      </div>
      <style jsx global>{`
        @keyframes sports-scroll {
          from {
            transform: translate(0, 0);
          }
          to {
            transform: translate(-160px, -160px);
          }
        }
        .animate-sports-scroll {
          animation: sports-scroll 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Helper functions
function formatOdds(odds: string, isPositive: boolean): string {
  return isPositive ? `+${odds}` : `-${odds}`;
}

function formatDate(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getSportColor(sportKey: string): string {
  const key = sportKey.toLowerCase();
  if (key.includes('football') || key.includes('nfl')) return '#013369';
  if (key.includes('basketball') || key.includes('nba')) return '#C9082A';
  if (key.includes('hockey') || key.includes('nhl')) return '#000000';
  if (key.includes('baseball') || key.includes('mlb')) return '#002D72';
  return '#F5B400';
}

// BetModal Component
interface BetModalProps {
  selection: BetSelection;
  balance: number | null;
  onClose: () => void;
  onPlaceBet: (amount: number) => Promise<void>;
  isPlacingBet: boolean;
}

interface ConfirmedBet {
  amount: number;
  potentialPayout: number;
}

function BetModal({ selection, balance, onClose, onPlaceBet, isPlacingBet }: BetModalProps) {
  const [betAmount, setBetAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedBet, setConfirmedBet] = useState<ConfirmedBet | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalSize, setModalSize] = useState({ width: 0, height: 0 });

  // Track modal size for confetti
  useEffect(() => {
    if (modalRef.current) {
      const { offsetWidth, offsetHeight } = modalRef.current;
      setModalSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [isSuccess]);

  const parsedAmount = parseFloat(betAmount) || 0;
  const hasInsufficientBalance = balance !== null && parsedAmount > balance;
  const isValidAmount = parsedAmount > 0 && !hasInsufficientBalance;

  // Calculate potential payout using same formula as contract
  const calculatePayout = (amount: number, odds: string, isPositive: boolean): number => {
    const oddsValue = parseFloat(odds);
    if (isPositive) {
      return amount + (amount * oddsValue / 100);
    } else {
      return amount + (amount * 100 / oddsValue);
    }
  };

  const potentialPayout = parsedAmount > 0 
    ? calculatePayout(parsedAmount, selection.odds, selection.oddsPositive)
    : 0;

  const handleSubmit = async () => {
    if (!isValidAmount) return;
    
    setError(null);
    try {
      await onPlaceBet(parsedAmount);
      // On success, show the success state
      setConfirmedBet({
        amount: parsedAmount,
        potentialPayout: potentialPayout,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bet';
      setError(errorMessage);
    }
  };

  const handleAmountChange = (value: string) => {
    // Only allow valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
      setError(null);
    }
  };

  const setPercentage = (percent: number) => {
    if (balance !== null) {
      const amount = (balance * percent / 100).toFixed(2);
      setBetAmount(amount);
      setError(null);
    }
  };

  // Success State UI
  if (isSuccess && confirmedBet) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          ref={modalRef}
          className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md overflow-hidden relative"
        >
          {/* Confetti - contained within modal */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <Confetti
              width={modalSize.width}
              height={modalSize.height}
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
              colors={['#F5B400', '#FFFFFF', '#000000']}
            />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between relative z-10">
            <h2 className="text-xl font-bold text-white">Bet Confirmed!</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Content */}
          <div className="p-6 space-y-5 relative z-10">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Bet Placed Successfully!</h3>
              <p className="text-zinc-400">Your bet has been confirmed on the blockchain.</p>
            </div>

            {/* Bet Recap */}
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
              {/* Match */}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Match</span>
                <span className="text-white text-sm font-medium">
                  {selection.market.away_team} @ {selection.market.home_team}
                </span>
              </div>
              
              {/* Pick */}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Your Pick</span>
                <span className="text-[#F5B400] font-semibold">{selection.teamName}</span>
              </div>

              {/* Odds */}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Odds</span>
                <span className={`font-bold ${selection.oddsPositive ? 'text-green-400' : 'text-white'}`}>
                  {selection.oddsPositive ? '+' : '-'}{selection.odds}
                </span>
              </div>

              {/* Stake */}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Stake</span>
                <span className="text-white font-medium">
                  {confirmedBet.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} smUSD
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-700 my-2" />

              {/* Potential Payout */}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Potential Payout</span>
                <span className="text-green-400 font-bold text-lg">
                  {confirmedBet.potentialPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} smUSD
                </span>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={onClose}
              className="w-full bg-[#F5B400] hover:bg-[#d9a000] text-black font-bold py-4 rounded-lg transition-colors duration-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal Bet Entry UI
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Place Bet</h2>
          <button
            onClick={onClose}
            disabled={isPlacingBet}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Match Info */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-zinc-400 text-sm mb-1 flex items-center gap-1.5">
              {getSportIcon(selection.market.sport_key)}
              {selection.market.sport_title}
            </p>
            <p className="text-white font-medium">
              {selection.market.away_team} @ {selection.market.home_team}
            </p>
          </div>

          {/* Selection */}
          <div className="flex items-center justify-between bg-[#F5B400]/10 border border-[#F5B400]/30 rounded-lg p-4">
            <div>
              <p className="text-zinc-400 text-sm">Your Pick</p>
              <p className="text-white font-semibold text-lg">{selection.teamName}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-sm">Odds</p>
              <p className={`font-bold text-xl ${selection.oddsPositive ? 'text-green-400' : 'text-white'}`}>
                {selection.oddsPositive ? '+' : '-'}{selection.odds}
              </p>
            </div>
          </div>

          {/* Bet Amount Input */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Bet Amount (smUSD)</label>
            <div className="relative">
              <input
                type="text"
                value={betAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                disabled={isPlacingBet}
                className={`w-full bg-zinc-800 border rounded-lg px-4 py-3 text-white text-lg font-medium placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#F5B400] disabled:opacity-50 ${
                  hasInsufficientBalance ? 'border-red-500' : 'border-zinc-700'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">smUSD</span>
            </div>
            
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setPercentage(percent)}
                  disabled={isPlacingBet || balance === null}
                  className="flex-1 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors disabled:opacity-50"
                >
                  {percent === 100 ? 'Max' : `${percent}%`}
                </button>
              ))}
            </div>

            {/* Balance display */}
            {balance !== null && (
              <p className={`text-sm mt-2 ${hasInsufficientBalance ? 'text-red-400' : 'text-zinc-500'}`}>
                Available: {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} smUSD
                {hasInsufficientBalance && ' (Insufficient balance)'}
              </p>
            )}
          </div>

          {/* Potential Payout */}
          {parsedAmount > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Potential Payout</span>
                <span className="text-green-400 font-bold text-xl">
                  {potentialPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} smUSD
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-zinc-500 text-sm">Potential Profit</span>
                <span className="text-zinc-400 text-sm">
                  +{(potentialPayout - parsedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} smUSD
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Disclosure */}
          <p className="text-zinc-500 text-xs text-center">
            All bets are final and cannot be reversed. By placing this bet, you agree to our terms.
          </p>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValidAmount || isPlacingBet}
            className="w-full bg-[#F5B400] hover:bg-[#d9a000] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isPlacingBet ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Placing Bet...
              </>
            ) : (
              'Place Bet'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// MarketCard Component
interface MarketCardProps {
  market: Market;
  onBetSelect: (market: Market, outcome: 'home' | 'away') => void;
  isWalletConnected: boolean;
}

function MarketCard({ market, onBetSelect, isWalletConnected }: MarketCardProps) {
  const sportColor = getSportColor(market.sport_key);
  const isLive = !market.is_resolved && !market.is_cancelled;
  const canBet = isLive && isWalletConnected;

  const handleBetClick = (outcome: 'home' | 'away') => {
    if (!canBet) return;
    onBetSelect(market, outcome);
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-2 py-1 rounded flex items-center gap-1.5"
            style={{ backgroundColor: sportColor, color: '#fff' }}
          >
            {getSportIcon(market.sport_key)}
            {market.sport_title}
          </span>
          <span className="text-zinc-400 text-sm">
            {formatDate(market.commence_time)}
          </span>
        </div>
        {market.is_resolved && (
          <span className="text-xs font-medium px-2 py-1 rounded bg-green-600 text-white">
            Final: {market.winning_outcome}
          </span>
        )}
        {market.is_cancelled && (
          <span className="text-xs font-medium px-2 py-1 rounded bg-red-600 text-white">
            Cancelled
          </span>
        )}
        {isLive && (
          <span className="text-xs font-medium px-2 py-1 rounded bg-[#F5B400] text-black">
            Open
          </span>
        )}
      </div>

      {/* Teams & Odds */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Away Team */}
          <button
            onClick={() => handleBetClick('away')}
            disabled={!canBet}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              canBet
                ? 'border-zinc-700 hover:border-[#F5B400] hover:bg-zinc-800 cursor-pointer'
                : 'border-zinc-800 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className="font-medium text-white">{market.away_team}</span>
            <span
              className={`font-bold text-lg ${
                market.away_odds_positive ? 'text-green-400' : 'text-white'
              }`}
            >
              {formatOdds(market.away_odds, market.away_odds_positive)}
            </span>
          </button>

          {/* Home Team */}
          <button
            onClick={() => handleBetClick('home')}
            disabled={!canBet}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              canBet
                ? 'border-zinc-700 hover:border-[#F5B400] hover:bg-zinc-800 cursor-pointer'
                : 'border-zinc-800 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className="font-medium text-white">{market.home_team}</span>
            <span
              className={`font-bold text-lg ${
                market.home_odds_positive ? 'text-green-400' : 'text-white'
              }`}
            >
              {formatOdds(market.home_odds, market.home_odds_positive)}
            </span>
          </button>
        </div>
        
        {/* Connect wallet hint */}
        {isLive && !isWalletConnected && (
          <p className="text-zinc-500 text-xs text-center mt-3">
            Connect wallet to place bets
          </p>
        )}
      </div>
    </div>
  );
}

// Loading Skeleton
function MarketCardSkeleton() {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
        <div className="h-6 w-16 bg-zinc-800 rounded" />
        <div className="h-4 w-32 bg-zinc-800 rounded" />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-14 bg-zinc-800 rounded-lg" />
          <div className="h-14 bg-zinc-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) =>
          typeof page === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? 'bg-[#F5B400] text-black'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="px-2 text-zinc-500">
              {page}
            </span>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// My Bets Section Component
interface MyBetsSectionProps {
  bets: Bet[];
  loading: boolean;
  filter: BetFilter;
  onFilterChange: (filter: BetFilter) => void;
  viewMode: BetViewMode;
  onViewModeChange: (mode: BetViewMode) => void;
  isConnected: boolean;
  onConnect: () => void;
}

function MyBetsSection({
  bets,
  loading,
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  isConnected,
  onConnect,
}: MyBetsSectionProps) {
  // Format helpers
  const formatBetAmount = (amount: string) => {
    return (parseInt(amount) / 100_000_000).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatBetOdds = (odds: string, isPositive: boolean) => {
    return isPositive ? `+${odds}` : `-${odds}`;
  };

  const formatBetDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getBetStatusColor = (bet: Bet) => {
    if (bet.is_settled) return 'bg-green-600';
    return 'bg-blue-600';
  };

  const getBetStatusText = (bet: Bet) => {
    if (bet.is_settled) return 'Settled';
    return 'Active';
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
        <div className="text-4xl mb-4"><FaLock className="mx-auto text-zinc-400" /></div>
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-zinc-400 mb-6">Connect your wallet to view your betting history</p>
        <button
          onClick={onConnect}
          className="bg-[#F5B400] hover:bg-[#d9a000] text-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-zinc-400 text-sm">Filter:</label>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as BetFilter)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5B400] focus:border-transparent"
          >
            {betFilterOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('tiles')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'tiles'
                ? 'bg-[#F5B400] text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-[#F5B400] text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#F5B400] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-zinc-400">Loading your bets...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && bets.length === 0 && (
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
          <div className="text-4xl mb-4"><FaDice className="mx-auto text-zinc-400" /></div>
          <h3 className="text-xl font-semibold mb-2">No Bets Found</h3>
          <p className="text-zinc-400">
            {filter === 'all'
              ? "You haven't placed any bets yet. Browse the markets above to get started!"
              : `No ${filter} bets to display.`}
          </p>
        </div>
      )}

      {/* Tiles View */}
      {!loading && bets.length > 0 && viewMode === 'tiles' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bets.map((bet) => (
            <div
              key={bet.bet_id}
              className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500">Bet #{bet.bet_id}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${getBetStatusColor(bet)} text-white`}>
                  {getBetStatusText(bet)}
                </span>
              </div>

              {/* Pick */}
              <div className="mb-3">
                <p className="text-zinc-400 text-xs mb-1">Your Pick</p>
                <p className="text-white font-semibold text-lg">{bet.outcome}</p>
              </div>

              {/* Odds & Amount */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-zinc-400 text-xs mb-1">Odds</p>
                  <p className={`font-bold ${bet.odds_positive ? 'text-green-400' : 'text-white'}`}>
                    {formatBetOdds(bet.odds, bet.odds_positive)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-xs mb-1">Stake</p>
                  <p className="text-white font-medium">{formatBetAmount(bet.amount)} smUSD</p>
                </div>
              </div>

              {/* Potential Payout */}
              <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Potential Payout</span>
                  <span className="text-green-400 font-bold">{formatBetAmount(bet.potential_payout)} smUSD</span>
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-zinc-500 text-xs text-right">{formatBetDate(bet.timestamp)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && bets.length > 0 && viewMode === 'table' && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-400 text-sm font-medium px-4 py-3">Bet ID</th>
                  <th className="text-left text-zinc-400 text-sm font-medium px-4 py-3">Pick</th>
                  <th className="text-left text-zinc-400 text-sm font-medium px-4 py-3">Odds</th>
                  <th className="text-right text-zinc-400 text-sm font-medium px-4 py-3">Stake</th>
                  <th className="text-right text-zinc-400 text-sm font-medium px-4 py-3">Potential</th>
                  <th className="text-center text-zinc-400 text-sm font-medium px-4 py-3">Status</th>
                  <th className="text-right text-zinc-400 text-sm font-medium px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.bet_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 text-sm">#{bet.bet_id}</td>
                    <td className="px-4 py-3 text-white font-medium">{bet.outcome}</td>
                    <td className={`px-4 py-3 font-bold ${bet.odds_positive ? 'text-green-400' : 'text-white'}`}>
                      {formatBetOdds(bet.odds, bet.odds_positive)}
                    </td>
                    <td className="px-4 py-3 text-white text-right">{formatBetAmount(bet.amount)}</td>
                    <td className="px-4 py-3 text-green-400 font-medium text-right">{formatBetAmount(bet.potential_payout)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getBetStatusColor(bet)} text-white`}>
                        {getBetStatusText(bet)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-sm text-right">{formatBetDate(bet.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bet Count */}
      {!loading && bets.length > 0 && (
        <p className="text-zinc-500 text-sm text-right">
          Showing {bets.length} bet{bets.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

// Faucet Section Component
interface FaucetSectionProps {
  isConnected: boolean;
  walletAddress: string | null;
  onConnect: () => void;
  onBalanceUpdate: () => void;
  signAndSubmitTransaction: (payload: any) => Promise<any>;
}

function FaucetSection({ isConnected, walletAddress, onConnect, onBalanceUpdate, signAndSubmitTransaction }: FaucetSectionProps) {
  const [mintAmount, setMintAmount] = useState<string>('100');
  const [isMinting, setIsMinting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [mintResult, setMintResult] = useState<{ success: boolean; message: string } | null>(null);

  // Check if user is registered for smUSD
  const checkRegistration = useCallback(async () => {
    if (!walletAddress) {
      setIsRegistered(null);
      return;
    }

    try {
      const response = await fetch(`${NODE_URL}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: `${CONTRACT_ADDRESS}::smusd::is_registered`,
          type_arguments: [],
          arguments: [walletAddress]
        })
      });
      
      const data = await response.json();
      setIsRegistered(data && data[0] === true);
    } catch (error) {
      console.error('Failed to check registration:', error);
      setIsRegistered(false);
    }
  }, [walletAddress]);

  // Check registration status when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      checkRegistration();
    } else {
      setIsRegistered(null);
    }
  }, [isConnected, walletAddress, checkRegistration]);

  // Handle registering for smUSD (user must sign this transaction)
  const handleRegister = async () => {
    if (!walletAddress) return;

    setIsRegistering(true);
    setMintResult(null);

    try {
      const payload = {
        data: {
          function: `${CONTRACT_ADDRESS}::smusd::register` as const,
          typeArguments: [],
          functionArguments: [],
        },
      };

      await signAndSubmitTransaction(payload);
      
      // Wait for transaction to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsRegistered(true);
      setMintResult({ success: true, message: 'Successfully registered for smUSD! You can now mint tokens.' });
    } catch (error: any) {
      console.error('Register error:', error);
      setMintResult({ success: false, message: error.message || 'Failed to register. Please try again.' });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleMint = async () => {
    if (!walletAddress || !mintAmount) return;

    const amount = parseFloat(mintAmount);
    if (isNaN(amount) || amount <= 0) {
      setMintResult({ success: false, message: 'Please enter a valid amount' });
      return;
    }

    if (amount > 1000) {
      setMintResult({ success: false, message: 'Maximum mint amount is 1000 smUSD' });
      return;
    }

    setIsMinting(true);
    setMintResult(null);

    try {
      const response = await fetch('/api/mint-smusd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMintResult({ success: true, message: `Successfully minted ${amount} smUSD!` });
        // Refresh balance after a short delay
        setTimeout(() => {
          onBalanceUpdate();
        }, 2000);
      } else {
        setMintResult({ success: false, message: data.error || 'Failed to mint smUSD' });
      }
    } catch (error) {
      console.error('Mint error:', error);
      setMintResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setIsMinting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMintAmount(value);
      setMintResult(null);
    }
  };

  const presetAmounts = [50, 100, 250, 500, 1000];

  return (
    <section id="faucet" className="py-8">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 border-b border-zinc-800 pb-4">
        smUSD Faucet
      </h2>
      
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#F5B400]/10 flex items-center justify-center shrink-0">
              <FaTint className="text-2xl text-[#F5B400]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Testnet Faucet</h3>
              <p className="text-zinc-400 text-sm">
                Get free smUSD tokens to test the platform. Maximum 1,000 smUSD per request.
              </p>
            </div>
          </div>

          {!isConnected ? (
            // Not connected state
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-zinc-400 mb-4">Connect your wallet to receive testnet tokens</p>
              <button
                onClick={onConnect}
                className="bg-[#F5B400] hover:bg-[#d9a000] text-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Connect Wallet
              </button>
            </div>
          ) : isRegistered === null ? (
            // Loading registration status
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-[#F5B400] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-zinc-400">Checking registration status...</p>
            </div>
          ) : !isRegistered ? (
            // Not registered - show registration step
            <div className="space-y-6">
              {/* Step indicator */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#F5B400] text-black font-bold flex items-center justify-center text-sm">1</div>
                  <span className="text-white font-medium">Register</span>
                </div>
                <div className="flex-1 h-px bg-zinc-700" />
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-400 font-bold flex items-center justify-center text-sm">2</div>
                  <span className="text-zinc-400 font-medium">Mint</span>
                </div>
              </div>

              {/* Registration explanation */}
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Registration Required</h4>
                    <p className="text-zinc-400 text-sm">
                      Before receiving smUSD tokens, you need to register your wallet. This is a one-time transaction that enables your wallet to hold smUSD.
                    </p>
                  </div>
                </div>
              </div>

              {/* Result Message */}
              {mintResult && (
                <div className={`rounded-lg p-4 ${
                  mintResult.success 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {mintResult.success ? (
                      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <p className={mintResult.success ? 'text-green-400' : 'text-red-400'}>
                      {mintResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="w-full bg-[#F5B400] hover:bg-[#d9a000] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registering...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Register for smUSD
                  </>
                )}
              </button>

              <p className="text-zinc-500 text-xs text-center">
                This will open your wallet to sign the registration transaction.
              </p>
            </div>
          ) : (
            // Registered - show mint form
            <div className="space-y-6">
              {/* Step indicator - completed */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white font-bold flex items-center justify-center text-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-green-400 font-medium">Registered</span>
                </div>
                <div className="flex-1 h-px bg-green-500/50" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#F5B400] text-black font-bold flex items-center justify-center text-sm">2</div>
                  <span className="text-white font-medium">Mint</span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Amount to mint</label>
                <div className="relative">
                  <input
                    type="text"
                    value={mintAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    disabled={isMinting}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg font-medium placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#F5B400] focus:border-transparent disabled:opacity-50 pr-20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">smUSD</span>
                </div>
              </div>

              {/* Preset Amounts */}
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setMintAmount(amount.toString());
                      setMintResult(null);
                    }}
                    disabled={isMinting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mintAmount === amount.toString()
                        ? 'bg-[#F5B400] text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    } disabled:opacity-50`}
                  >
                    {amount} smUSD
                  </button>
                ))}
              </div>

              {/* Result Message */}
              {mintResult && (
                <div className={`rounded-lg p-4 ${
                  mintResult.success 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {mintResult.success ? (
                      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <p className={mintResult.success ? 'text-green-400' : 'text-red-400'}>
                      {mintResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={isMinting || !mintAmount || parseFloat(mintAmount) <= 0}
                className="w-full bg-[#F5B400] hover:bg-[#d9a000] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isMinting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Minting...
                  </>
                ) : (
                  <>
                    <FaTint className="text-lg" />
                    Mint smUSD
                  </>
                )}
              </button>

              {/* Info */}
              <p className="text-zinc-500 text-xs text-center">
                This is testnet smUSD with no real value. Use it to test the betting platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function SportsBook() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportFilter>('all');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('active');
  const [dateSort, setDateSort] = useState<DateSort>('soonest');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [smUsdBalance, setSmUsdBalance] = useState<number | null>(null);
  const [betSelection, setBetSelection] = useState<BetSelection | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [betsFilter, setBetsFilter] = useState<BetFilter>('all');
  const [betsViewMode, setBetsViewMode] = useState<BetViewMode>('tiles');
  const [loadingBets, setLoadingBets] = useState(false);

  // Wallet hook
  const { connected, account, connect, disconnect, wallets, signAndSubmitTransaction } = useWallet();

  // Fetch smUSD balance
  const fetchSmUsdBalance = useCallback(async () => {
    if (!account?.address) {
      setSmUsdBalance(null);
      return;
    }

    try {
      const response = await fetch(`${NODE_URL}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: `${CONTRACT_ADDRESS}::smusd::balance_of`,
          type_arguments: [],
          arguments: [account.address.toString()]
        })
      });
      
      const data = await response.json();
      if (data && data[0]) {
        // smUSD has 8 decimals
        setSmUsdBalance(Number(data[0]) / 100_000_000);
      }
    } catch (error) {
      console.error('Failed to fetch smUSD balance:', error);
      setSmUsdBalance(null);
    }
  }, [account?.address]);

  // Fetch user bets
  const fetchUserBets = useCallback(async () => {
    if (!account?.address) {
      setUserBets([]);
      return;
    }

    setLoadingBets(true);
    try {
      const response = await fetch(`/api/get-user-bets?address=${account.address.toString()}&filter=${betsFilter}`);
      const data = await response.json();
      setUserBets(data.bets || []);
    } catch (error) {
      console.error('Failed to fetch user bets:', error);
      setUserBets([]);
    } finally {
      setLoadingBets(false);
    }
  }, [account?.address, betsFilter]);

  // Fetch balance when wallet connects
  useEffect(() => {
    if (connected && account?.address) {
      fetchSmUsdBalance();
    } else {
      setSmUsdBalance(null);
    }
  }, [connected, account?.address, fetchSmUsdBalance]);

  // Fetch user bets when wallet connects or filter changes
  useEffect(() => {
    if (connected && account?.address) {
      fetchUserBets();
    } else {
      setUserBets([]);
    }
  }, [connected, account?.address, betsFilter, fetchUserBets]);

  // Handle wallet connect
  const handleConnect = async () => {
    try {
      // Find Nightly wallet
      const nightlyWallet = wallets?.find(w => w.name.toLowerCase().includes('nightly'));
      if (nightlyWallet) {
        await connect(nightlyWallet.name);
      } else if (wallets && wallets.length > 0) {
        await connect(wallets[0].name);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // Handle wallet disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSmUsdBalance(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  // Handle bet selection from MarketCard
  const handleBetSelect = (market: Market, outcome: 'home' | 'away') => {
    const teamName = outcome === 'home' ? market.home_team : market.away_team;
    const odds = outcome === 'home' ? market.home_odds : market.away_odds;
    const oddsPositive = outcome === 'home' ? market.home_odds_positive : market.away_odds_positive;

    setBetSelection({
      market,
      outcome,
      teamName,
      odds,
      oddsPositive,
    });
  };

  // Handle placing bet on contract
  const handlePlaceBet = async (amount: number) => {
    if (!betSelection || !account?.address) {
      throw new Error('No bet selection or wallet not connected');
    }

    setIsPlacingBet(true);
    try {
      // Convert amount to smallest unit (8 decimals)
      const amountInSmallestUnit = Math.floor(amount * 100_000_000);

      const payload = {
        data: {
          function: `${CONTRACT_ADDRESS}::sports_betting::place_bet` as const,
          typeArguments: [],
          functionArguments: [
            betSelection.market.game_id,
            betSelection.teamName, // Use team name as outcome
            amountInSmallestUnit.toString(),
          ],
        },
      };

      const response = await signAndSubmitTransaction(payload);
      
      // Wait a bit for transaction to process, then refresh balance and bets
      await new Promise(resolve => setTimeout(resolve, 2000));
      await Promise.all([fetchSmUsdBalance(), fetchUserBets()]);
      
      // Success! The modal will now show the success state
      // (don't close it here - the modal handles its own success UI)
    } catch (error) {
      console.error('Failed to place bet:', error);
      throw error;
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Fetch markets
  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/get-markets?filter=${marketFilter}&competition=${selectedSport}`);
      const data = await response.json();
      setMarkets(data.markets || []);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch markets when filter or sport changes
  useEffect(() => {
    fetchMarkets();
    setCurrentPage(1);
  }, [marketFilter, selectedSport]);

  // Sort markets by date
  const sortedMarkets = [...markets].sort((a, b) => {
    const dateA = parseInt(a.commence_time);
    const dateB = parseInt(b.commence_time);
    return dateSort === 'soonest' ? dateA - dateB : dateB - dateA;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedMarkets.length / MARKETS_PER_PAGE);
  const paginatedMarkets = sortedMarkets.slice(
    (currentPage - 1) * MARKETS_PER_PAGE,
    currentPage * MARKETS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to markets section
    document.getElementById('markets')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black">
      <NavBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        walletAddress={account?.address?.toString() || null}
        smUsdBalance={smUsdBalance}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-white">
          {/* Hero Section */}
          <Hero isConnected={connected} onConnect={handleConnect} />

          {/* Markets Section */}
          <section id="markets" className="py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Available Markets
              </h2>
              <div className="text-sm text-zinc-400">
                {!loading && `${markets.length} market${markets.length !== 1 ? 's' : ''} found`}
              </div>
            </div>

            {/* Filter Tabs Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Market Status Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {marketFilterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMarketFilter(tab.key)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      marketFilter === tab.key
                        ? 'bg-[#F5B400] text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sport Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:ml-auto">
                {sportTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedSport(tab.key)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                      selectedSport === tab.key
                        ? 'bg-[#F5B400] text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Sort Filter */}
            <div className="flex items-center gap-3 mb-6">
              <label className="text-zinc-400 text-sm">Sort by Date:</label>
              <div className="flex gap-2">
                {dateSortOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setDateSort(option.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      dateSort === option.key
                        ? 'bg-[#F5B400] text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Markets List */}
            <div className="space-y-4">
              {loading ? (
                // Loading skeletons
                <>
                  {[...Array(3)].map((_, i) => (
                    <MarketCardSkeleton key={i} />
                  ))}
                </>
              ) : paginatedMarkets.length === 0 ? (
                // Empty state
                <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
                  <div className="text-4xl mb-4"><FaFootballBall className="mx-auto text-zinc-400" /></div>
                  <h3 className="text-xl font-semibold mb-2">No Markets Found</h3>
                  <p className="text-zinc-400">
                    {marketFilter === 'active'
                      ? 'There are no active markets at the moment. Check back later!'
                      : `No ${marketFilter} markets to display.`}
                  </p>
                </div>
              ) : (
                // Market cards
                paginatedMarkets.map((market) => (
                  <MarketCard 
                    key={market.game_id} 
                    market={market} 
                    onBetSelect={handleBetSelect}
                    isWalletConnected={connected}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {!loading && markets.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </section>

          <section id="my-bets" className="py-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 border-b border-zinc-800 pb-4">
              My Bets
            </h2>
            <MyBetsSection
              bets={userBets}
              loading={loadingBets}
              filter={betsFilter}
              onFilterChange={setBetsFilter}
              viewMode={betsViewMode}
              onViewModeChange={setBetsViewMode}
              isConnected={connected}
              onConnect={handleConnect}
            />
          </section>

          <section id="how-it-works" className="py-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 border-b border-zinc-800 pb-4">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-[#F5B400]/50 transition-colors duration-200">
                <div className="text-4xl mb-4"><FaLink className="text-[#F5B400]" /></div>
                <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
                <p className="text-zinc-400">Link your Movement wallet to get started</p>
              </div>
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-[#F5B400]/50 transition-colors duration-200">
                <div className="text-4xl mb-4"><FaFootballBall className="text-[#F5B400]" /></div>
                <h3 className="text-xl font-semibold mb-2">Browse Markets</h3>
                <p className="text-zinc-400">Explore available sports betting markets</p>
              </div>
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-[#F5B400]/50 transition-colors duration-200">
                <div className="text-4xl mb-4"><FaMoneyBill1Wave className="text-[#F5B400]" /></div>
                <h3 className="text-xl font-semibold mb-2">Place Bets</h3>
                <p className="text-zinc-400">Place your bets securely on-chain</p>
              </div>
            </div>
          </section>

          {/* Faucet Section */}
          <FaucetSection 
            isConnected={connected}
            walletAddress={account?.address?.toString() || null}
            onConnect={handleConnect}
            onBalanceUpdate={fetchSmUsdBalance}
            signAndSubmitTransaction={signAndSubmitTransaction}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Image
              src="/SPORTS_MOVE_LOGO.png"
              alt="Sports Move Logo"
              width={140}
              height={32}
              className="h-6 w-auto"
            />
            <p className="text-zinc-500 text-sm">
              © 2025 Sports Move. Powered by Movement Network.
            </p>
          </div>
        </div>
      </footer>

      {/* Bet Modal */}
      {betSelection && (
        <BetModal
          selection={betSelection}
          balance={smUsdBalance}
          onClose={() => setBetSelection(null)}
          onPlaceBet={handlePlaceBet}
          isPlacingBet={isPlacingBet}
        />
      )}
    </div>
  );
}

