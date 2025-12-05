'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Main App Color: #000000
 * Highlight Color (Logo Text Color): #F5B400
 * Text Color: #FFFFFF
 */

interface NavBarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

function NavBar({ isMobileMenuOpen, setIsMobileMenuOpen }: NavBarProps) {
  const navLinks = [
    { label: 'Markets', href: '#markets' },
    { label: 'My Bets', href: '#my-bets' },
    { label: 'How It Works', href: '#how-it-works' },
  ];

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
            <button className="bg-[#F5B400] hover:bg-[#d9a000] text-black font-semibold px-5 py-2 rounded-lg transition-colors duration-200">
              Connect Wallet
            </button>
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
            isMobileMenuOpen ? 'max-h-64 pb-4' : 'max-h-0'
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
            <button className="bg-[#F5B400] hover:bg-[#d9a000] text-black font-semibold px-5 py-3 rounded-lg transition-colors duration-200 mt-2">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

type SportFilter = 'all' | 'nfl' | 'nhl' | 'mlb' | 'nba';

const sportTabs: { key: SportFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'nfl', label: 'NFL' },
  { key: 'nhl', label: 'NHL' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nba', label: 'NBA' },
];

export default function SportsBook() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportFilter>('all');

  return (
    <div className="min-h-screen bg-black">
      <NavBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-white">
          {/* Hero Section */}
          <section className="py-12 sm:py-20 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Bet on Sports with{' '}
              <span className="text-[#F5B400]">Movement</span>
            </h1>
            <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
              Decentralized sports betting powered by the Movement Network.
              Fast, transparent, and secure.
            </p>
            <button className="bg-[#F5B400] hover:bg-[#d9a000] text-black font-semibold px-8 py-3 rounded-lg text-lg transition-colors duration-200">
              Get Started
            </button>
          </section>

          {/* Content Placeholder */}
          <section id="markets" className="py-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 border-b border-zinc-800 pb-4">
              Available Markets
            </h2>

            {/* Sport Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
              {sportTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedSport(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedSport === tab.key
                      ? 'bg-[#F5B400] text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <p className="text-zinc-400">
                {selectedSport === 'all'
                  ? 'Showing all markets...'
                  : `Showing ${selectedSport.toUpperCase()} markets...`}
              </p>
            </div>
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
