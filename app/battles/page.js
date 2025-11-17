'use client';

import { useEffect, useState } from 'react';
import BattleCard from '@/components/BattleCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getBattleStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function BattlesPage() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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

  const filteredBattles = battles.filter(battle => {
    if (activeTab === 'all') return true;
    return battle.status === activeTab;
  });

  const tabs = [
    { id: 'all', label: 'All Battles' },
    { id: 'active', label: 'Active' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ended', label: 'Ended' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-gradient mb-2">All Battles</h1>
        <p className="text-gray-400">Join the competition or spectate the action</p>
      </div>

      <div className="mb-8 border-b border-border">
        <nav className="flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-bts-purple text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-border'
              )}
            >
              <span>{tab.label}</span>
              <span className="bg-panel border border-border text-gray-300 px-2 py-0.5 rounded-full text-xs">
                {tab.id === 'all' ? battles.length : battles.filter(b => b.status === tab.id).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredBattles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBattles.map((battle) => (
            <BattleCard key={battle.id} battle={battle} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-panel border border-border rounded-lg">
          <p className="text-gray-300 text-lg">No battles found in this category</p>
          <p className="text-gray-400 mt-2">Check back soon or create your own!</p>
        </div>
      )}
    </div>
  );
}
