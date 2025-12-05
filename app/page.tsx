'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FaFootballBall, FaBasketballBall, FaBaseballBall, FaHockeyPuck, FaFutbol } from 'react-icons/fa';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

/**
 * Main App Color: #000000
 * Highlight Color (Logo Text Color): #F5B400
 * Text Color: #FFFFFF
 */

// Contract configuration
const CONTRACT_ADDRESS = '0x5b1fb1ac32ddc2e2adca17a0829ec9d8b93d2cb14489ab1fea3b332395f6f5a5';
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

const MARKETS_PER_PAGE = 10;

const marketFilterTabs: { key: MarketFilter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'cancelled', label: 'Cancelled' },
];

const sportTabs: { key: SportFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'nfl', label: 'NFL' },
  { key: 'nhl', label: 'NHL' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nba', label: 'NBA' },
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

// MarketCard Component
interface MarketCardProps {
  market: Market;
}

function MarketCard({ market }: MarketCardProps) {
  const sportColor = getSportColor(market.sport_key);
  const isLive = !market.is_resolved && !market.is_cancelled;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-2 py-1 rounded"
            style={{ backgroundColor: sportColor, color: '#fff' }}
          >
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
            disabled={!isLive}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              isLive
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
            disabled={!isLive}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              isLive
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

export default function SportsBook() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportFilter>('all');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('active');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [smUsdBalance, setSmUsdBalance] = useState<number | null>(null);

  // Wallet hook
  const { connected, account, connect, disconnect, wallets } = useWallet();

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

  // Fetch balance when wallet connects
  useEffect(() => {
    if (connected && account?.address) {
      fetchSmUsdBalance();
    } else {
      setSmUsdBalance(null);
    }
  }, [connected, account?.address, fetchSmUsdBalance]);

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

  // Fetch markets
  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/get-markets?filter=${marketFilter}`);
      const data = await response.json();
      setMarkets(data.markets || []);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch markets when filter changes
  useEffect(() => {
    fetchMarkets();
    setCurrentPage(1);
  }, [marketFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(markets.length / MARKETS_PER_PAGE);
  const paginatedMarkets = markets.slice(
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
                    className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedSport === tab.key
                        ? 'bg-zinc-700 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {tab.label}
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
                  <div className="text-4xl mb-4">🏟️</div>
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
                  <MarketCard key={market.game_id} market={market} />
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
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <p className="text-zinc-400">Your bets will appear here...</p>
            </div>
          </section>

          <section id="how-it-works" className="py-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 border-b border-zinc-800 pb-4">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Connect Wallet',
                  description: 'Link your Movement wallet to get started',
                  icon: '🔗',
                },
                {
                  title: 'Browse Markets',
                  description: 'Explore available sports betting markets',
                  icon: '🏈',
                },
                {
                  title: 'Place Bets',
                  description: 'Place your bets securely on-chain',
                  icon: '💰',
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-[#F5B400]/50 transition-colors duration-200"
                >
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-zinc-400">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
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
    </div>
  );
}

