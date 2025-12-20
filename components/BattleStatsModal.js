'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function BattleStatsModal({ isOpen, onClose, battleId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && battleId) {
      fetchStats();
    }
  }, [isOpen, battleId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/battle/${battleId}/stats`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const memberNames = ['RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jung Kook'];
  const memberColors = {
    'RM': 'from-purple-600 to-purple-800',
    'Jin': 'from-pink-600 to-pink-800',
    'Suga': 'from-gray-600 to-gray-800',
    'J-Hope': 'from-orange-600 to-orange-800',
    'Jimin': 'from-yellow-600 to-yellow-800',
    'V': 'from-green-600 to-green-800',
    'Jung Kook': 'from-purple-600 to-purple-800'
  };

  const getMemberIcon = (member) => {
    const icons = {
      'RM': '🎤',
      'Jin': '💎',
      'Suga': '🎹',
      'J-Hope': '☀️',
      'Jimin': '🌙',
      'V': '🐯',
      'Jung Kook': '🐰'
    };
    return icons[member] || '⭐';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-500/30 bg-gradient-to-br from-gray-900 to-purple-950/50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-purple-500/20 bg-gray-900/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/40">
              <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Battle Statistics</h2>
              <p className="text-sm text-purple-300/60">BTS & Member Stream Counts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500"></div>
              <p className="mt-4 text-sm text-purple-300/60">Loading stats...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}

          {stats && !loading && (
            <div className="space-y-6">
              {/* Total BTS Streams */}
              <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-purple-950/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-purple-400/60">Total BTS Streams</p>
                    <p className="mt-2 text-5xl font-black text-white">{stats.totalBTSStreams.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-purple-300/60">Across all participants (including those who left)</p>
                  </div>
                  <div className="text-6xl">💜</div>
                </div>
              </div>

              {/* Member Stats */}
              <div>
                <h3 className="mb-4 text-lg font-bold text-white">Individual Member Streams</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {memberNames.map((member) => {
                    const count = stats.memberStats[member] || 0;
                    const percentage = stats.totalBTSStreams > 0
                      ? ((count / stats.totalBTSStreams) * 100).toFixed(1)
                      : 0;

                    return (
                      <div
                        key={member}
                        className={cn(
                          'group relative overflow-hidden rounded-xl border border-white/10 p-4 transition-all hover:scale-105',
                          `bg-gradient-to-br ${memberColors[member]}`
                        )}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-black text-white text-lg">{member}</p>
                            <span className="text-2xl">{getMemberIcon(member)}</span>
                          </div>
                          <p className="text-3xl font-black text-white">{count.toLocaleString()}</p>
                          <p className="text-xs text-white/60 mt-1">{percentage}% of total</p>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Tracks */}
              {stats.topTracks && stats.topTracks.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-bold text-white">Most Streamed Tracks</h3>
                  <div className="space-y-2">
                    {stats.topTracks.slice(0, 10).map((track, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-3 transition-colors hover:bg-purple-900/40"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border font-bold text-xs',
                            index === 0 ? 'bg-yellow-500 text-gray-900 border-yellow-500/50' :
                            index === 1 ? 'bg-gray-400 text-gray-900 border-gray-400/50' :
                            index === 2 ? 'bg-orange-500 text-gray-900 border-orange-500/50' :
                            'bg-purple-900/40 text-purple-300 border-purple-500/30'
                          )}>
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white truncate">{track.title}</p>
                            <p className="text-xs text-purple-300/60 truncate">{track.artist}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <p className="text-2xl font-black text-white">{track.count}</p>
                          <p className="text-xs text-purple-300/60 text-right">plays</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {stats.lastUpdated && (
                <div className="text-center text-xs text-purple-300/60">
                  Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
