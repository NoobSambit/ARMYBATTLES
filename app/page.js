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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">🔴 Active Battles</h2>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" />
          ) : activeBattles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBattles.map((battle) => (
                <BattleCard key={battle.id} battle={battle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No active battles at the moment</p>
              <p className="text-gray-500 mt-2">Check back soon or create your own!</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">📅 Upcoming Battles</h2>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" />
          ) : upcomingBattles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBattles.map((battle) => (
                <BattleCard key={battle.id} battle={battle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No upcoming battles</p>
              <p className="text-gray-500 mt-2">Be the first to create one!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
