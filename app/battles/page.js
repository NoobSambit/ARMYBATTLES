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
      <div className="mb-10 animate-slide-up">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">All Battles</h1>
        <p className="text-lg text-gray-400">Join the competition or spectate the action</p>
      </div>

      <div className="mb-10 animate-slide-up">
        <nav className="flex space-x-2 overflow-x-auto p-1 bg-panel/50 backdrop-blur-sm border border-border-light rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-3 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 text-white border border-bts-purple/30 shadow-glow-purple'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-panel-hover'
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold',
                activeTab === tab.id
                  ? 'bg-bts-purple/30 text-white'
                  : 'bg-panel-hover border border-border-light text-gray-300'
              )}>
                {tab.id === 'all' ? battles.length : battles.filter(b => b.status === tab.id).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredBattles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {filteredBattles.map((battle) => (
            <BattleCard key={battle.id} battle={battle} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 card-glass animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-bts-purple/20 to-bts-pink/20 border border-bts-purple/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-200 text-xl font-semibold mb-2">No battles found in this category</p>
          <p className="text-gray-400">Check back soon or create your own!</p>
        </div>
      )}
    </div>
  );
}
