'use client';

import { useEffect, useState } from 'react';
import Hero from '@/components/Hero';
import BattleCard from '@/components/BattleCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getBattleStatus } from '@/lib/utils';

export default function Home() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBattles();
  }, []);

  const fetchBattles = async () => {
    try {
      const res = await fetch('/api/battle/list');
      const data = await res.json();
      if (res.ok) {
        const battlesWithStatus = data.battles.map(battle => ({
          ...battle,
          status: getBattleStatus(battle),
        }));
        setBattles(battlesWithStatus);
      }
    } catch (err) {
      console.error('Failed to fetch battles:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBattles = battles.filter(b => b.status === 'active');
  const upcomingBattles = battles.filter(b => b.status === 'upcoming');

  return (
    <div>
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10 animate-slide-up">
            <div>
              <h2 className="section-title mb-0">Active Battles</h2>
              <p className="text-gray-400 mt-2">Join the live competition now</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-sm font-semibold text-green-300">Live</span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : activeBattles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
              {activeBattles.map((battle) => (
                <BattleCard key={battle.id} battle={battle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 card-glass">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-bts-purple/20 to-bts-pink/20 border border-bts-purple/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-gray-200 text-xl font-semibold mb-2">No active battles at the moment</p>
              <p className="text-gray-400">Check back soon or create your own!</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-10 animate-slide-up">
            <div>
              <h2 className="section-title mb-0">Upcoming Battles</h2>
              <p className="text-gray-400 mt-2">Get ready for the next challenge</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : upcomingBattles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
              {upcomingBattles.map((battle) => (
                <BattleCard key={battle.id} battle={battle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 card-glass">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-200 text-xl font-semibold mb-2">No upcoming battles</p>
              <p className="text-gray-400">Be the first to create one!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
