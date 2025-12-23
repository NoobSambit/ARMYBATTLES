'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Member colors and info for avatars
const MEMBER_INFO = {
  'RM': { color: 'from-purple-600 to-purple-800', initial: 'R' },
  'Jin': { color: 'from-pink-600 to-pink-800', initial: 'J' },
  'Suga': { color: 'from-gray-600 to-gray-800', initial: 'S' },
  'J-Hope': { color: 'from-orange-600 to-orange-800', initial: 'JH' },
  'Jimin': { color: 'from-yellow-600 to-yellow-800', initial: 'J' },
  'V': { color: 'from-green-600 to-green-800', initial: 'V' },
  'Jung Kook': { color: 'from-purple-600 to-purple-800', initial: 'JK' }
};

export default function BattleStatsModal({ isOpen, onClose, battleId }) {
  const [stats, setStats] = useState(null);
  const [battleInfo, setBattleInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [memberPhotos, setMemberPhotos] = useState({});

  useEffect(() => {
    if (isOpen && battleId) {
      fetchStats();
      fetchMemberPhotos();
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
      setBattleInfo({
        name: data.battleName,
        description: data.battleDescription,
        status: data.battleStatus,
        goal: data.goal
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberPhotos = async () => {
    const artists = ['BTS', 'RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jung Kook'];
    const photos = {};

    // Fetch all photos in parallel
    await Promise.all(
      artists.map(async (artist) => {
        try {
          const res = await fetch(`/api/member-photos?artist=${encodeURIComponent(artist)}`);
          const data = await res.json();
          if (data.photoUrl) {
            photos[artist] = data.photoUrl;
          }
        } catch (err) {
          console.error(`Failed to fetch photo for ${artist}:`, err);
        }
      })
    );

    setMemberPhotos(photos);
  };

  if (!isOpen) return null;

  const memberNames = ['RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jung Kook'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg bg-gray-900 border border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/95 px-5 py-3 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white">Battle Statistics</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-purple-500"></div>
              <p className="mt-3 text-sm text-gray-500">Loading stats...</p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {stats && !loading && battleInfo && (
            <div className="space-y-5">
              {/* Goal Progress - Only show if battle has a goal */}
              {battleInfo.goal && (
                <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-300">Battle Goal</h3>
                    <span className="text-xs font-medium text-gray-500">
                      {Math.min(100, Math.round((stats.totalStreams / battleInfo.goal) * 100))}% Complete
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-8 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50 mb-3">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out flex items-center justify-end px-3"
                      style={{ width: `${Math.min(100, (stats.totalStreams / battleInfo.goal) * 100)}%` }}
                    >
                      {stats.totalStreams >= battleInfo.goal * 0.1 && (
                        <span className="text-xs font-bold text-white drop-shadow-lg">
                          {stats.totalStreams.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {stats.totalStreams < battleInfo.goal * 0.1 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-400">
                          {stats.totalStreams.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Current Progress</p>
                      <p className="text-white font-bold text-lg">{stats.totalStreams.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Target Goal</p>
                      <p className="text-white font-bold text-lg">{battleInfo.goal.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Remaining</p>
                      <p className={cn(
                        "font-bold text-lg",
                        stats.totalStreams >= battleInfo.goal ? "text-green-400" : "text-orange-400"
                      )}>
                        {stats.totalStreams >= battleInfo.goal ? "Complete!" : (battleInfo.goal - stats.totalStreams).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {battleInfo.description && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <p className="text-xs text-gray-400 italic">{battleInfo.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Total BTS Group Streams */}
              <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-4">
                <div className="flex items-center gap-4">
                  {memberPhotos['BTS'] ? (
                    <img
                      src={memberPhotos['BTS']}
                      alt="BTS"
                      className="h-16 w-16 rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={cn(
                    "h-16 w-16 rounded-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-500/30 flex-shrink-0",
                    memberPhotos['BTS'] ? "hidden" : "flex"
                  )}>
                    <span className="text-white font-bold text-xl">BTS</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">BTS Group Streams</p>
                    <p className="mt-1 text-3xl font-bold text-white">{stats.totalBTSStreams.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Group releases only</p>
                  </div>
                </div>
              </div>

              {/* Member Solo Streams */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-400">MEMBER SOLO STREAMS</h3>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {memberNames.map((member) => {
                    const count = stats.memberStats[member] || 0;

                    return (
                      <div
                        key={member}
                        className="group relative overflow-hidden rounded-lg bg-gray-800/50 border border-gray-700 p-3 transition-all hover:bg-gray-800 hover:border-gray-600"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {memberPhotos[member] ? (
                            <img
                              src={memberPhotos[member]}
                              alt={member}
                              className="h-8 w-8 rounded-full object-cover border border-gray-700 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={cn(
                            "h-8 w-8 rounded-full items-center justify-center border border-gray-700 flex-shrink-0 bg-gradient-to-br",
                            MEMBER_INFO[member].color,
                            memberPhotos[member] ? "hidden" : "flex"
                          )}>
                            <span className="text-white font-bold text-xs">{MEMBER_INFO[member].initial}</span>
                          </div>
                          <p className="font-semibold text-white text-sm">{member}</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{count.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">solo streams</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Tracks */}
              {stats.topTracks && stats.topTracks.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-400">TOP TRACKS</h3>
                  <div className="space-y-1">
                    {stats.topTracks.slice(0, 5).map((track, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md bg-gray-800/30 border border-gray-800 px-3 py-2 transition-colors hover:bg-gray-800/60"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={cn(
                            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold',
                            index === 0 ? 'bg-yellow-500 text-gray-900' :
                            index === 1 ? 'bg-gray-400 text-gray-900' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-700 text-gray-300'
                          )}>
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-sm truncate">{track.title}</p>
                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-white ml-3">{track.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {stats.lastUpdated && (
                <div className="text-center text-xs text-gray-600 pt-2">
                  Updated {new Date(stats.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
