'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Badge from '@/components/Badge';
import TeamCard from '@/components/TeamCard';
import TeamDetailsModal from '@/components/TeamDetailsModal';
import BattleJoinModal from '@/components/BattleJoinModal';
import KickParticipantModal from '@/components/KickParticipantModal';
import ExtendBattleModal from '@/components/ExtendBattleModal';
import ScorecardModal from '@/components/ScorecardModal';
import BattleStatsModal from '@/components/BattleStatsModal';
import SyncModal from '@/components/SyncModal';
import { formatDate, getBattleStatus } from '@/lib/utils';

export default function BattlePage({ params }) {
  const [battle, setBattle] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);

  // Team-related state
  const [leaderboardFilter, setLeaderboardFilter] = useState('all');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userInBattle, setUserInBattle] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [endingBattle, setEndingBattle] = useState(false);

  // Host control modals
  const [kickModalOpen, setKickModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [scorecardModalOpen, setScorecardModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  // Sync state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');

  // Leave battle state
  const [leavingBattle, setLeavingBattle] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
    } else {
      setCurrentUser(null);
    }

    const battleId = params.id;
    fetchLeaderboard(battleId);
    if (token && userData) {
      checkUserInBattle(battleId);
    } else {
      setIsHost(false);
      setUserInBattle(false);
    }

    // Poll for leaderboard updates every 2 minutes (120 seconds)
    // Optimized for Netlify serverless - matches backend verification cycle
    // Only poll when tab is visible and battle is active
    let pollingInterval = null;

    // Only set up polling if battle is active
    if (!battle || battle.status === 'active') {
      pollingInterval = setInterval(() => {
        // Check if tab is visible and battle is still active
        if (document.visibilityState === 'visible' && (!battle || battle.status === 'active')) {
          fetchLeaderboard(battleId);
        }
      }, 120000); // 2 minutes
    }

    // Add visibility change listener to immediately fetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && battle?.status === 'active') {
        fetchLeaderboard(battleId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [params.id, battle?.status]);

  useEffect(() => {
    // Refetch when filter changes
    if (params.id) {
      fetchLeaderboard(params.id);
    }
  }, [leaderboardFilter, params.id]);

  const checkUserInBattle = async (battleId) => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!userData) return;

      const user = JSON.parse(userData);
      const res = await fetch(`/api/battle/${battleId}/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        // Check if current user is the battle host
        const userIsHost = data.hostId === user.id;
        setIsHost(userIsHost);

        // Check if current user is in participants
        const isInBattle = data.participants && data.participants.includes(user.id);
        setUserInBattle(isInBattle);
      }
    } catch (err) {
      console.error('Error checking user in battle:', err);
    }
  };

  const fetchLeaderboard = async (battleId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/battle/${battleId}/leaderboard?filter=${leaderboardFilter}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      const resolvedStatus = getBattleStatus({
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      setBattle({
        _id: battleId,
        name: data.battleName,
        status: resolvedStatus,
        startTime: data.startTime,
        endTime: data.endTime,
        participantCount: data.participantCount,
        spotifyPlaylist: data.spotifyPlaylist,
        finalLeaderboard: data.status === 'ended' ? data.leaderboard : null,
      });
      setLeaderboard(data.leaderboard);
      setLastUpdated(data.updatedAt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBattle = async () => {
    // Prevent multiple clicks
    if (endingBattle) {
      return;
    }

    if (!confirm('Are you sure you want to end this battle? This action cannot be undone.')) {
      return;
    }

    try {
      setEndingBattle(true);

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/battle/${params.id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to end battle');
      }

      // Immediately update UI with the response from API
      setBattle(prev => prev ? {
        ...prev,
        status: 'ended',
        finalLeaderboard: data.battle?.finalLeaderboard || prev.finalLeaderboard
      } : null);

      // Update leaderboard with final results
      if (data.battle?.finalLeaderboard) {
        setLeaderboard(data.battle.finalLeaderboard);
      }

      alert('Battle ended successfully!');

      // Fetch fresh data after a delay to ensure DB has committed
      setTimeout(() => {
        fetchLeaderboard(params.id);
        setEndingBattle(false);
      }, 1000);
    } catch (err) {
      alert(`Error: ${err.message}`);
      setEndingBattle(false);
    }
  };

  const handleQuickSync = async () => {
    try {
      setSyncLoading(true);
      setSyncError('');
      setSyncSuccess('');

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/battle/sync/quick`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ battleId: params.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data.message || 'Rate limited. Wait before syncing again.');
        }
        throw new Error(data.error || 'Sync failed');
      }

      setSyncSuccess(`Synced ${data.count} scrobbles!`);
      setTimeout(() => {
        fetchLeaderboard(params.id);
        setSyncSuccess('');
      }, 2000);

    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleFullSync = async () => {
    if (!confirm('Full sync may take 2-3 minutes. Continue?')) return;

    try {
      setSyncLoading(true);
      setSyncError('');
      setSyncSuccess('');

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/battle/sync/trigger-full`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ battleId: params.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data.message || 'Rate limited.');
        }
        throw new Error(data.error || 'Failed to trigger full sync');
      }

      setSyncSuccess('Full sync initiated! Refresh in 2-3 minutes.');

    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleLeaveBattle = async () => {
    if (!confirm('Are you sure you want to leave this battle? Your progress will be lost and you can join other battles.')) {
      return;
    }

    try {
      setLeavingBattle(true);
      setSyncError('');
      setSyncSuccess('');

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/battle/${params.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to leave battle');
      }

      alert('You have successfully left the battle!');

      // Redirect to dashboard after leaving
      window.location.href = '/dashboard';

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLeavingBattle(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
        <Link href="/dashboard">
          <button className="btn-secondary">Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark">
        <div className="flex flex-col items-center justify-center py-40 animate-pulse-slow">
          <div className="relative w-36 h-36 mb-10">
            <div className="absolute inset-0 border-4 border-bts-purple/10 rounded-full"></div>
            <div className="absolute inset-0 border-[5px] border-bts-pink rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1.2s' }}></div>
            <div className="absolute inset-3 border-4 border-bts-blue/40 rounded-full border-b-transparent animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-bts-purple animate-pulse drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                crisis_alert
              </span>
            </div>
          </div>
          <h3 className="text-3xl font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-bts-purple to-bts-pink mb-4 uppercase drop-shadow-sm">
            Loading Arena
          </h3>
          <p className="text-bts-blue-light uppercase tracking-[0.3em] text-sm font-bold flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-bts-blue animate-ping"></span>
            Connecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 min-h-screen">
      {/* Back button */}
      <Link href="/dashboard">
        <button className="group flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-2.5 font-bold text-gray-400 backdrop-blur-md transition-all duration-300 hover:border-[#7b2cbf]/40 hover:bg-[#7b2cbf]/10 hover:text-white hover:shadow-[0_0_20px_rgba(123,44,191,0.15)] mb-10">
          <svg className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="tracking-wide text-xs sm:text-sm uppercase">Command Center</span>
        </button>
      </Link>

      {/* Battle header */}
      <div className="mb-10 animate-slide-up relative z-10">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#f3e8ff] via-[#d8b4fe] to-[#9333ea] drop-shadow-[0_4px_30px_rgba(168,85,247,0.4)]">
              {battle.name}
            </h1>
            <Badge status={battle.status} className="text-base self-start sm:self-auto shadow-[0_0_15px_rgba(123,44,191,0.2)]" />
          </div>
          {/* Battle playlist CTA + embed */}
          {battle.spotifyPlaylist && (
            // Derive playlist URLs from the stored Spotify playlist ID
            // We always store the bare playlist ID in Mongo, not the full URL
            (() => {
              const playlistId = battle.spotifyPlaylist;
              const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;
              // Use the large embed style requested
              const playlistEmbedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/40 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-[#1DB954]"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fill="currentColor"
                            d="M12 2a10 10 0 1010 10A10.011 10.011 0 0012 2zm4.53 14.71a.75.75 0 01-1.03.24 8.23 8.23 0 00-4.07-1.09 8.37 8.37 0 00-2.86.49.75.75 0 11-.5-1.41 9.87 9.87 0 013.36-.57 9.7 9.7 0 014.79 1.29.75.75 0 01.31 1.05zm1.43-3.02a.94.94 0 01-1.29.31 11.42 11.42 0 00-5.4-1.46 11.18 11.18 0 00-3.68.6.94.94 0 11-.6-1.78 12.98 12.98 0 014.28-.7 13.3 13.3 0 016.3 1.7.94.94 0 01.39 1.33zm.13-3.14a1.13 1.13 0 01-1.54.37 13.93 13.93 0 00-6.68-1.81 13.6 13.6 0 00-4.39.72 1.13 1.13 0 11-.73-2.14 15.85 15.85 0 015.11-.83 16.17 16.17 0 017.76 2.1 1.13 1.13 0 01.47 1.59z"
                          />
                        </svg>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                          Battle Playlist
                        </p>
                        <p className="text-sm text-gray-300">
                          Queue this playlist on Spotify while you stream for scrobbles.
                        </p>
                      </div>
                    </div>
                    <a
                      href={playlistUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-[#1DB954] text-sm font-semibold text-black shadow-[0_0_30px_rgba(29,185,84,0.65)] hover:brightness-110 transition-all duration-200 w-full sm:w-auto"
                    >
                      <span className="mr-2">Open on Spotify</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h13M12 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                  </div>
                  <div className="rounded-xl overflow-hidden bg-black shadow-lg">
                    <iframe
                      src={playlistEmbedUrl}
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allowfullscreen=""
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      style={{ borderRadius: '12px' }}
                      title={`${battle.name} playlist`}
                    />
                  </div>
                </div>
              );
            })()
          )}
          <div className="flex flex-wrap items-center gap-3">
            {currentUser && !userInBattle && battle.status !== 'ended' && (
              <button
                onClick={() => setJoinModalOpen(true)}
                className="group relative overflow-hidden px-8 py-3.5 rounded-xl font-black transition-all duration-300 bg-[#7b2cbf]/10 text-[#c77dff] hover:text-white border border-[#7b2cbf]/40 hover:border-[#c77dff] shadow-lg hover:shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf] to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
                <span className="relative z-10 flex items-center gap-2 tracking-widest uppercase">
                  Join Battle
                </span>
              </button>
            )}
            {currentUser && userInBattle && battle.status !== 'ended' && (
              <button
                onClick={() => setJoinModalOpen(true)}
                className="group relative overflow-hidden px-6 py-3.5 rounded-xl font-black transition-all duration-300 bg-[#5a189a]/15 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/40 hover:border-[#c77dff] shadow-lg hover:shadow-[0_0_30px_rgba(157,78,221,0.25)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#5a189a] to-[#7b2cbf] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
                <span className="relative z-10 flex items-center gap-2 tracking-widest uppercase">
                  Teams
                </span>
              </button>
            )}
            {!currentUser && battle.status !== 'ended' && (
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl font-bold transition-all duration-300 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20 flex items-center gap-2.5 tracking-wide text-sm sm:text-base hover:-translate-y-1 shadow-sm hover:shadow-lg"
              >
                Log In To Join
              </Link>
            )}
            <button
              onClick={() => setStatsModalOpen(true)}
              className="px-6 py-3.5 rounded-xl font-bold transition-all duration-300 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20 flex items-center gap-2.5 tracking-wide text-sm sm:text-base hover:-translate-y-1 shadow-sm hover:shadow-lg"
              title="View BTS & member statistics"
            >
              <svg className="h-5 w-5 text-[#c77dff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </button>
            {userInBattle && battle.status === 'ended' && (
              <button
                onClick={() => setScorecardModalOpen(true)}
                className="px-6 py-3.5 rounded-xl font-bold transition-all duration-300 bg-[#5a189a]/20 text-[#c77dff] hover:text-white border border-[#5a189a]/50 hover:border-[#9d4edd] hover:bg-[#7b2cbf]/30 flex items-center gap-2.5 tracking-wide text-sm sm:text-base hover:-translate-y-1 shadow-md hover:shadow-[0_0_20px_rgba(157,78,221,0.2)]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View Scorecard</span>
              </button>
            )}
            {userInBattle && battle.status === 'active' && (
              <button
                onClick={() => setSyncModalOpen(true)}
                disabled={syncLoading}
                className="px-6 py-3.5 rounded-xl font-bold transition-all duration-300 bg-blue-600/10 text-blue-400 hover:text-white hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:hover:scale-100 flex items-center gap-2.5 text-sm sm:text-base hover:-translate-y-1"
                title="Manually sync your scrobbles"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline tracking-wide">{syncLoading ? 'SYNCING...' : 'SYNC RADAR'}</span>
                <span className="sm:hidden">{syncLoading ? '...' : 'SYNC'}</span>
              </button>
            )}
            {userInBattle && !isHost && battle.status !== 'ended' && (
              <button
                onClick={handleLeaveBattle}
                disabled={leavingBattle}
                className="px-5 py-3.5 rounded-xl font-bold transition-all duration-300 bg-red-900/20 text-red-400 hover:text-white hover:bg-red-800/40 border border-red-500/20 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center gap-2.5 text-sm sm:text-base hover:-translate-y-1 ml-auto"
                title="Leave this battle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Leave</span>
              </button>
            )}
            {isHost && (
              <div className="flex gap-2 ml-auto">
                {battle.status !== 'ended' && (
                  <>
                    <button
                      onClick={() => setExtendModalOpen(true)}
                      className="px-5 py-3.5 rounded-xl font-bold transition-all duration-300 bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:bg-white/10 flex items-center gap-2 text-sm sm:text-base shadow-md hover:-translate-y-1"
                    >
                      <span className="material-symbols-outlined text-xl">update</span>
                      <span className="hidden sm:inline">Extend</span>
                    </button>
                    <button
                      onClick={handleEndBattle}
                      disabled={endingBattle}
                      className="px-5 py-3.5 rounded-xl font-bold transition-all duration-300 bg-red-900/20 text-red-500 hover:text-white hover:bg-red-600 border border-red-500/30 hover:border-red-500 shadow-md hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 text-sm sm:text-base hover:-translate-y-1"
                    >
                      {endingBattle ? 'ABORTING...' : 'ABORT'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="h-1 w-32 bg-gradient-to-r from-[#c77dff] to-[#5a189a] rounded-full mb-2 shadow-[0_0_10px_rgba(157,78,221,0.5)]" />
      </div>

      {/* Sync Status Messages */}
      {
        (syncError || syncSuccess) && (
          <div className={`mb-6 p-4 rounded-lg border ${syncError
            ? 'bg-red-500/10 border-red-500/25 text-red-300'
            : 'bg-green-500/10 border-green-500/25 text-green-300'
            } animate-slide-up`}>
            <div className="flex items-center gap-2">
              {syncError && (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{syncError}</span>
                </>
              )}
              {syncSuccess && (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{syncSuccess}</span>
                </>
              )}
            </div>
          </div>
        )
      }

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-12 relative z-10">
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#090b14] p-4 backdrop-blur-sm transition-all hover:border-[#7b2cbf]/30 md:p-7 animate-scale-in shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7b2cbf]/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#7b2cbf]/10 transition-colors"></div>
          <div className="relative flex flex-col items-center md:items-start md:gap-3 text-center md:text-left">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-3 md:mb-1">
              <span className="material-symbols-outlined text-[1.2rem] md:text-[1.5rem] text-gray-400 group-hover:text-[#c77dff] transition-colors">schedule</span>
            </div>
            <div>
              <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-[#c77dff]/80 transition-colors">Start</h3>
              <p className="text-xs sm:text-sm md:text-base font-black text-gray-200 group-hover:text-white transition-colors">
                {formatDate(battle.startTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#090b14] p-4 backdrop-blur-sm transition-all hover:border-[#9d4edd]/30 md:p-7 animate-scale-in delay-75 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#9d4edd]/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#9d4edd]/10 transition-colors"></div>
          <div className="relative flex flex-col items-center md:items-start md:gap-3 text-center md:text-left">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-3 md:mb-1">
              <span className="material-symbols-outlined text-[1.2rem] md:text-[1.5rem] text-gray-400 group-hover:text-[#e0aaff] transition-colors">flag</span>
            </div>
            <div>
              <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-[#e0aaff]/80 transition-colors">End</h3>
              <p className="text-xs sm:text-sm md:text-base font-black text-gray-200 group-hover:text-white transition-colors">
                {formatDate(battle.endTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#090b14] p-4 backdrop-blur-sm transition-all hover:border-[#5a189a]/40 md:p-7 animate-scale-in delay-150 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5a189a]/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#5a189a]/10 transition-colors"></div>
          <div className="relative flex flex-col items-center md:items-start md:gap-3 text-center md:text-left">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-3 md:mb-1">
              <span className="material-symbols-outlined text-[1.2rem] md:text-[1.5rem] text-gray-400 group-hover:text-[#d8b4fe] transition-colors">group</span>
            </div>
            <div>
              <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-[#d8b4fe]/80 transition-colors">Joined</h3>
              <p className="text-xl md:text-2xl font-black text-gray-200 group-hover:text-white transition-colors">{battle.participantCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#7b2cbf]/20 bg-[#090b14] p-5 md:p-8 shadow-2xl mb-8 animate-slide-up">
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[#7b2cbf]/10 blur-[80px] pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-1">
              LIVE LEADERBOARD
            </h2>
            <p className="text-sm text-[#c77dff]/70 font-semibold tracking-wide uppercase">Real-time stream stats</p>
          </div>
          {battle.status === 'active' && (
            <div className="flex items-center gap-2.5 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm self-start">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live Sync</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="relative flex gap-2 mb-8 flex-wrap p-1.5 bg-white/5 rounded-xl self-start w-fit">
          <button
            onClick={() => setLeaderboardFilter('all')}
            className={cn(
              'px-5 py-2.5 rounded-lg font-bold transition-all duration-300 text-xs sm:text-sm tracking-wide',
              leaderboardFilter === 'all'
                ? 'bg-[#7b2cbf] text-white shadow-[0_0_15px_rgba(123,44,191,0.4)]'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            ALL
          </button>
          <button
            onClick={() => setLeaderboardFilter('teams')}
            className={cn(
              'px-5 py-2.5 rounded-lg font-bold transition-all duration-300 text-xs sm:text-sm tracking-wide',
              leaderboardFilter === 'teams'
                ? 'bg-[#7b2cbf] text-white shadow-[0_0_15px_rgba(123,44,191,0.4)]'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            TEAMS
          </button>
          <button
            onClick={() => setLeaderboardFilter('solo')}
            className={cn(
              'px-5 py-2.5 rounded-lg font-bold transition-all duration-300 text-xs sm:text-sm tracking-wide',
              leaderboardFilter === 'solo'
                ? 'bg-[#7b2cbf] text-white shadow-[0_0_15px_rgba(123,44,191,0.4)]'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            SOLO
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="relative text-center py-20 bg-purple-950/20 border border-purple-500/20 rounded-xl backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <div className="relative w-20 h-20 mx-auto mb-6 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="relative text-white text-xl font-black mb-2">No scores yet</p>
            <p className="relative text-purple-300/60 font-semibold">Start listening to playlist tracks to see scores!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Leaderboard Header */}
            <div className="hidden md:flex items-center justify-between px-6 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
              <div className="flex items-center gap-4 flex-1">
                <span className="w-12 text-center">Rank</span>
                <span>Participant</span>
              </div>
              <div className="flex items-center gap-4 w-32 justify-end">
                <span>Score</span>
              </div>
            </div>

            {leaderboard.map((entry, index) => {
              const rank = index + 1;

              if (entry.type === 'team') {
                // Render team card
                return (
                  <TeamCard
                    key={entry.teamId?.toString() || `team-${index}`}
                    team={entry}
                    rank={rank}
                    onClick={() => setSelectedTeamId(entry.teamId)}
                  />
                );
              } else {
                // Render solo player card
                return (
                  <div
                    key={entry.userId?.toString() || `solo-${index}`}
                    className={cn(
                      'group relative overflow-hidden rounded-xl border backdrop-blur-sm p-3 md:p-6 transition-all hover:scale-[1.01]',
                      rank === 1
                        ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 shadow-lg shadow-yellow-500/10'
                        : rank === 2
                          ? 'border-gray-400/50 bg-gradient-to-r from-gray-500/20 to-gray-400/10 shadow-lg shadow-gray-500/10'
                          : rank === 3
                            ? 'border-orange-500/30 bg-orange-900/10 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                            : entry.isCheater
                              ? 'border-red-500/30 bg-red-950/20'
                              : 'border-white/[0.05] bg-white/[0.01] hover:border-[#7b2cbf]/30 hover:bg-white/[0.02]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 md:gap-5">
                      {/* Rank & Player Info */}
                      <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                        {/* Rank Badge */}
                        <div className={cn(
                          'w-10 h-10 md:w-14 md:h-14 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm md:text-xl border',
                          rank === 1
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                            : rank === 2
                              ? 'bg-gray-400/10 text-gray-300 border-gray-400/30 shadow-[0_0_15px_rgba(156,163,175,0.2)]'
                              : rank === 3
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                                : 'bg-black/30 text-gray-500 border-white/5'
                        )}>
                          {rank <= 3 ? rank : `#${rank}`}
                        </div>

                        {/* Player Details */}
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm md:text-base border border-white/5 overflow-hidden ${rank === 1 ? 'bg-[#7b2cbf]/40' : 'bg-black/40'
                            }`}>
                            {entry.avatarUrl ? (
                              <img
                                src={entry.avatarUrl}
                                alt={entry.username}
                                className="w-full h-full rounded-lg object-cover"
                              />
                            ) : (
                              entry.username?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <p className="font-bold text-gray-100 text-xs sm:text-sm md:text-base truncate">
                              {entry.displayName || entry.username}
                            </p>
                            <p className="text-[10px] md:text-sm text-muted truncate">@{entry.username}</p>
                            {entry.isCheater && (
                              <p className="text-[10px] text-red-400 font-medium flex items-center gap-0.5 mt-1">
                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>Suspicious</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score & Actions */}
                      <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tighter">
                            {entry.count}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-muted uppercase tracking-wider md:hidden">
                            Scrobbles
                          </div>
                        </div>
                        {isHost && battle.status !== 'ended' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedParticipant({
                                userId: entry.userId,
                                username: entry.username,
                                score: entry.count,
                              });
                              setKickModalOpen(true);
                            }}
                            className="p-1.5 md:px-3 md:py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all duration-200 flex-shrink-0"
                            title="Remove participant"
                          >
                            <span className="md:hidden text-sm">✕</span>
                            <span className="hidden md:inline text-sm font-medium">Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Info & Sync Notice - Combined */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#090b14] p-6 lg:p-8 shadow-2xl animate-slide-up mt-8">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-[#7b2cbf]/10 blur-[60px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#c77dff]/5 blur-[40px] pointer-events-none"></div>
        <div className="relative z-10">
          {/* Main info section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-2xl text-[#c77dff]">auto_awesome</span>
            </div>
            <div>
              <p className="text-[15px] sm:text-base text-gray-300 leading-relaxed font-bold tracking-wide">
                {battle.status === 'active' && (
                  <>Invite ARMYs or join a team to conquer the leaderboard. Stream together to win.</>
                )}
                {battle.status === 'ended' && (
                  <>Battle has ended. See final stats above. Great streaming!</>
                )}
                {battle.status === 'upcoming' && (
                  <>Battle starts soon. Get your team ready to stream!</>
                )}
              </p>
            </div>
          </div>

          {/* Sync timing info */}
          {battle.status === 'active' && (
            <div className="text-center pt-6 sm:pt-8 border-t border-white/10 mt-6 sm:mt-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#e0aaff] text-xl sm:text-2xl animate-pulse">cloud_sync</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-100 uppercase tracking-widest">Sync Station</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-400 mb-6 leading-relaxed max-w-2xl mx-auto">
                Scrobbles automatically sync every <span className="text-[#c77dff] font-bold">15-30 minutes</span>.
                <br className="hidden sm:block" />
                Want it faster? Hit the <span className="text-[#e0aaff] font-bold">SYNC</span> button on your card.
                <br />
                <span className="text-xs text-gray-500 mt-2 block font-medium uppercase tracking-widest">Help keep operations running. Support server costs.</span>
              </p>
              <Link
                href="https://ko-fi.com/noobsambit"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#7b2cbf]/20 text-[#c77dff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] rounded-xl font-bold transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(123,44,191,0.2)] hover:shadow-[0_0_40px_rgba(199,125,255,0.4)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf] to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
                <span className="relative z-10 flex items-center gap-2 tracking-widest uppercase">
                  <span className="material-symbols-outlined text-lg">volunteer_activism</span>
                  Funding
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BattleJoinModal
        battleId={params.id}
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        teamOnly={userInBattle}
        onSuccess={() => {
          fetchLeaderboard(params.id);
          setUserInBattle(true);
        }}
      />

      <TeamDetailsModal
        teamId={selectedTeamId}
        isOpen={!!selectedTeamId}
        onClose={() => setSelectedTeamId(null)}
      />

      {/* Host Control Modals */}
      <KickParticipantModal
        isOpen={kickModalOpen}
        onClose={() => {
          setKickModalOpen(false);
          setSelectedParticipant(null);
        }}
        participant={selectedParticipant}
        battleId={params.id}
        onKickSuccess={() => {
          fetchLeaderboard(params.id);
          setKickModalOpen(false);
          setSelectedParticipant(null);
        }}
      />

      <ExtendBattleModal
        isOpen={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        battle={battle}
        onExtendSuccess={(data) => {
          setBattle(prev => ({
            ...prev,
            endTime: data.battle.newEndTime,
          }));
          setExtendModalOpen(false);
        }}
      />

      <ScorecardModal
        isOpen={scorecardModalOpen}
        onClose={() => setScorecardModalOpen(false)}
        battle={battle}
        currentUser={currentUser}
        userStats={leaderboard.find(entry => entry.userId === (currentUser?.id || currentUser?._id))}
      />

      <BattleStatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        battleId={params.id}
      />

      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onQuickSync={handleQuickSync}
        onFullSync={handleFullSync}
        loading={syncLoading}
      />
    </div >
  );
}
