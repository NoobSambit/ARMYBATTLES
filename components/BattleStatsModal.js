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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#000000]/85 backdrop-blur-xl animate-fade-in transition-all duration-400" />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-[#090b14] border border-[#7b2cbf]/30 rounded-3xl shadow-[0_0_40px_rgba(157,78,221,0.2)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c77dff] to-transparent opacity-50" />

        {/* Subtle glow behind title */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#7b2cbf]/15 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex-shrink-0 flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.05] bg-transparent">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#f3e8ff] via-[#d8b4fe] to-[#9333ea] mb-1 tracking-tight drop-shadow-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-[#c77dff] text-2xl">monitoring</span>
              Battle Statistics
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-[#c77dff] to-[#5a189a] rounded-full shadow-[0_0_10px_rgba(157,78,221,0.5)]" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-300 p-2.5 rounded-xl hover:bg-white/5 hover:rotate-90 hover:scale-110 transform group"
          >
            <span className="material-symbols-outlined group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto px-6 sm:px-8 py-6 pb-8 custom-scrollbar">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/10 border-t-[#c77dff] mb-4 shadow-[0_0_15px_rgba(199,125,255,0.5)]"></div>
              <p className="text-sm font-bold tracking-widest uppercase text-[#c77dff]">Loading Stats...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-950/30 border border-red-500/30 text-red-400 font-bold px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {stats && !loading && battleInfo && (
            <div className="space-y-8">
              {/* Goal Progress - Only show if battle has a goal */}
              {battleInfo.goal && (
                <div className="relative overflow-hidden bg-black/40 border border-[#7b2cbf]/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(123,44,191,0.1)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c77dff]/5 to-transparent pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#c77dff] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#e0aaff]">flag</span>
                        Battle Goal
                      </h3>
                      <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-white bg-[#7b2cbf]/20 border border-[#7b2cbf]/50 px-2 py-1 rounded-md">
                        {Math.min(100, Math.round((stats.totalStreams / battleInfo.goal) * 100))}% COMPLETE
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-6 sm:h-8 bg-black/60 rounded-full overflow-hidden border border-white/5 mb-5 shadow-inner">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#5a189a] to-[#c77dff] transition-all duration-1000 ease-out flex items-center justify-end px-3 shadow-[0_0_15px_rgba(199,125,255,0.5)]"
                        style={{ width: `${Math.min(100, (stats.totalStreams / battleInfo.goal) * 100)}%` }}
                      >
                        {stats.totalStreams >= battleInfo.goal * 0.1 && (
                          <span className="text-[10px] sm:text-xs font-black tracking-widest text-white drop-shadow-md">
                            {stats.totalStreams.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {stats.totalStreams < battleInfo.goal * 0.1 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] sm:text-xs font-black tracking-widest text-gray-500">
                            {stats.totalStreams.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 border-t border-white/[0.05] pt-4 custom-stats-grid">
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current</p>
                        <p className="text-white font-black text-sm sm:text-xl md:text-2xl tracking-tight">{stats.totalStreams.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] sm:text-[10px] text-[#e0aaff]/60 font-bold uppercase tracking-widest mb-1">Goal</p>
                        <p className="text-[#e0aaff] font-black text-sm sm:text-xl md:text-2xl tracking-tight">{battleInfo.goal.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Remaining</p>
                        <p className={cn(
                          "font-black text-sm sm:text-xl md:text-2xl tracking-tight",
                          stats.totalStreams >= battleInfo.goal ? "text-[#a7f3d0] drop-shadow-[0_0_5px_rgba(167,243,208,0.5)]" : "text-yellow-500"
                        )}>
                          {stats.totalStreams >= battleInfo.goal ? "0" : (battleInfo.goal - stats.totalStreams).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {battleInfo.description && (
                      <div className="mt-4 pt-4 border-t border-white/[0.05]">
                        <p className="text-xs text-gray-400 font-medium italic border-l-2 border-[#7b2cbf] pl-3 py-1">" {battleInfo.description} "</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Total BTS Group Streams */}
              <div className="group relative overflow-hidden rounded-2xl bg-black/40 border border-[#7b2cbf]/20 p-5 sm:p-6 transition-all duration-300 hover:border-[#c77dff]/40 hover:shadow-[0_0_20px_rgba(157,78,221,0.15)] flex items-center gap-5 sm:gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7b2cbf]/10 blur-2xl rounded-full group-hover:bg-[#7b2cbf]/20 transition-all"></div>

                <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center bg-black border-2 border-[#7b2cbf]/40 flex-shrink-0 shadow-[0_0_15px_rgba(123,44,191,0.3)] overflow-hidden group-hover:border-[#c77dff] transition-all">
                  {memberPhotos['BTS'] ? (
                    <img
                      src={memberPhotos['BTS']}
                      alt="BTS"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={cn(
                    "w-full h-full items-center justify-center bg-gradient-to-br from-[#c77dff] to-[#5a189a]",
                    memberPhotos['BTS'] ? "hidden" : "flex"
                  )}>
                    <span className="text-white font-black text-2xl tracking-tighter drop-shadow-md">BTS</span>
                  </div>
                </div>

                <div className="relative z-10 flex-1">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#c77dff] mb-1">Total Group Streams</p>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-[#a3a3a3] tracking-tighter drop-shadow-md mb-1.5">{stats.totalBTSStreams.toLocaleString()}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-white/5 bg-white/5 inline-block px-2 py-1 rounded">Group songs only</p>
                </div>
              </div>

              {/* Member Solo Streams */}
              <div>
                <h3 className="mb-4 text-xs font-black tracking-widest text-gray-400 uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#c77dff] text-base">person</span>
                  Solo Showdowns
                </h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {memberNames.map((member) => {
                    const count = stats.memberStats[member] || 0;

                    return (
                      <div
                        key={member}
                        className="group relative overflow-hidden rounded-xl bg-black/40 border border-white/5 p-4 transition-all duration-300 hover:bg-black/60 hover:border-[#7b2cbf]/40 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(123,44,191,0.15)] flex flex-col justify-between"
                      >
                        <div className="absolute inset-0 bg-[#7b2cbf]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="relative z-10 flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 group-hover:border-[#c77dff]/40 transition-colors flex flex-shrink-0 items-center justify-center bg-black">
                            {memberPhotos[member] ? (
                              <img
                                src={memberPhotos[member]}
                                alt={member}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={cn(
                              "w-full h-full items-center justify-center bg-gradient-to-br text-white font-black text-xs",
                              MEMBER_INFO[member].color,
                              memberPhotos[member] ? "hidden" : "flex"
                            )}>
                              {MEMBER_INFO[member].initial}
                            </div>
                          </div>
                          <p className="font-bold text-gray-200 text-sm group-hover:text-white transition-colors truncate">{member}</p>
                        </div>
                        <div className="relative z-10">
                          <p className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none mb-1">{count.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-[#c77dff]/70 uppercase tracking-widest">Solo Streams</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Tracks */}
              {stats.topTracks && stats.topTracks.length > 0 && (
                <div>
                  <h3 className="mb-4 text-xs font-black tracking-widest text-gray-400 uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#c77dff] text-base">format_list_numbered</span>
                    Top Tracks
                  </h3>
                  <div className="space-y-2">
                    {stats.topTracks.slice(0, 5).map((track, index) => (
                      <div
                        key={index}
                        className="group flex items-center justify-between rounded-xl bg-black/40 border border-white/5 px-4 py-3 sm:py-4 transition-all duration-300 hover:bg-black/60 hover:border-[#7b2cbf]/30 hover:shadow-[0_0_15px_rgba(123,44,191,0.1)] relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#c77dff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 flex-1 min-w-0 z-10">
                          <span className={cn(
                            'flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs sm:text-sm font-black shadow-inner',
                            index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 border border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.3)]' :
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 border border-gray-400/50 shadow-[0_0_10px_rgba(156,163,175,0.3)]' :
                                index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 border border-amber-600/50 shadow-[0_0_10px_rgba(217,119,6,0.3)]' :
                                  'bg-white/5 border border-white/10 text-gray-300 group-hover:text-white transition-colors group-hover:bg-white/10'
                          )}>
                            {index === 0 ? <span className="text-sm drop-shadow-sm">👑</span> : `#${index + 1}`}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-100 text-sm sm:text-base truncate group-hover:text-white transition-colors">{track.title}</p>
                            <p className="text-[10px] sm:text-xs text-[#c77dff] font-medium tracking-wide truncate">{track.artist}</p>
                          </div>
                        </div>
                        <div className="text-right z-10 pl-4">
                          <p className="text-sm sm:text-lg font-black text-white group-hover:text-[#f3e8ff] transition-colors">{track.count.toLocaleString()}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Plays</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {stats.lastUpdated && (
                <div className="text-center text-[10px] font-bold uppercase tracking-widest text-[#7b2cbf] pt-4 border-t border-white/[0.05]">
                  <span className="opacity-70">LAST UPDATED AT</span> <br className="sm:hidden" /> <span className="text-[#e0aaff] ml-1">{new Date(stats.lastUpdated).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
