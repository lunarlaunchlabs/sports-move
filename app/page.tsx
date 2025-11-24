'use client';

import { useEffect, useState } from 'react';
import Image from "next/image";

export default function Home() {
  const [markets, setMarkets] = useState<any>(null);
  const [scores, setScores] = useState<any>(null);

  useEffect(() => {
    fetch('/api/markets?sport=americanfootball_nfl')
      .then((res) => res.json())
      .then((data) => setMarkets(data));
    
    fetch('/api/scores?sport=americanfootball_nfl')
      .then((res) => res.json())
      .then((data) => setScores(data));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-6xl flex-col items-center py-16 px-8 bg-white dark:bg-black">
        <Image
          className="dark:invert mb-12"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Markets Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Markets
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Data from /api/markets
            </p>
            {markets && (
              <pre className="text-xs text-zinc-800 dark:text-zinc-200 overflow-auto max-h-[600px] bg-zinc-100 dark:bg-zinc-900 p-4 rounded">
                {JSON.stringify(markets, null, 2)}
              </pre>
            )}
          </div>

          {/* Scores Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Scores
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Data from /api/scores
            </p>
            {scores && (
              <pre className="text-xs text-zinc-800 dark:text-zinc-200 overflow-auto max-h-[600px] bg-zinc-100 dark:bg-zinc-900 p-4 rounded">
                {JSON.stringify(scores, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
