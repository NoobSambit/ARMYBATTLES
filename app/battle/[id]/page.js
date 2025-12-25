'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import TeamCard from '@/components/TeamCard';
import TeamDetailsModal from '@/components/TeamDetailsModal';
import BattleJoinModal from '@/components/BattleJoinModal';
import KickParticipantModal from '@/components/KickParticipantModal';
import ExtendBattleModal from '@/components/ExtendBattleModal';
import ScorecardModal from '@/components/ScorecardModal';
import BattleStatsModal from '@/components/BattleStatsModal';
import SyncModal from '@/components/SyncModal';
import { formatDate } from '@/lib/utils';

export default function BattlePage({ params }) {
  const router = useRouter();
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

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    const battleId = params.id;
    fetchLeaderboard(battleId);
    checkUserInBattle(battleId);

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
  }, [params.id, router, battle?.status]);

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

      setBattle({
        _id: battleId,
        name: data.battleName,
        status: data.status,
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
      router.push('/dashboard');

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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <Link href="/dashboard">
        <button className="group flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-950/30 px-4 py-2.5 font-semibold text-purple-300 backdrop-blur-sm transition-all hover:border-purple-500/40 hover:bg-purple-900/40 hover:text-purple-200 mb-8">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </Link>

      {/* Battle header */}
      <div className="mb-10 animate-slide-up">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {battle.name}
            </h1>
            <Badge status={battle.status} className="text-base self-start sm:self-auto" />
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
          <div className="flex flex-wrap items-center gap-2">
            {!userInBattle && battle.status !== 'ended' && (
              <button
                onClick={() => setJoinModalOpen(true)}
                className="px-6 py-3 rounded-lg font-bold transition-all duration-200 bg-purple-600 text-white hover:bg-purple-700 border border-purple-500/50 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Join Battle
              </button>
            )}
            <button
              onClick={() => setStatsModalOpen(true)}
              className="px-4 py-3 rounded-lg font-bold transition-all duration-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border border-purple-500/50 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 text-sm sm:text-base"
              title="View BTS & member statistics"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">Stats</span>
              <span className="sm:hidden">📊</span>
            </button>
            {userInBattle && battle.status === 'ended' && (
              <button
                onClick={() => setScorecardModalOpen(true)}
                className="btn-primary px-6 py-3 flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View Scorecard</span>
              </button>
            )}
            {userInBattle && battle.status === 'active' && (
              <button
                onClick={() => setSyncModalOpen(true)}
                disabled={syncLoading}
                className="px-4 py-3 rounded-lg font-bold transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/50 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 text-sm sm:text-base"
                title="Manually sync your scrobbles"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">{syncLoading ? 'Syncing...' : 'Sync'}</span>
                <span className="sm:hidden">{syncLoading ? '...' : '🔄'}</span>
              </button>
            )}
            {userInBattle && !isHost && battle.status !== 'ended' && (
              <button
                onClick={handleLeaveBattle}
                disabled={leavingBattle}
                className="px-4 py-3 rounded-lg font-bold transition-all duration-200 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-500/50 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 text-sm sm:text-base"
                title="Leave this battle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">{leavingBattle ? 'Leaving...' : 'Leave Battle'}</span>
                <span className="sm:hidden">{leavingBattle ? '...' : 'Leave'}</span>
              </button>
            )}
            {isHost && (
              <>
                {battle.status !== 'ended' && (
                  <>
                    <button
                      onClick={() => setExtendModalOpen(true)}
                      className="px-4 py-3 rounded-lg font-bold transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 text-sm sm:text-base border border-blue-500/50 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <span>⏰</span>
                      <span className="hidden sm:inline">Extend</span>
                    </button>
                    <button
                      onClick={handleEndBattle}
                      disabled={endingBattle}
                      className="px-4 py-3 rounded-lg font-bold transition-all duration-200 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base border border-red-500/50 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                    >
                      {endingBattle ? 'Ending...' : 'End Battle'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="h-1 w-32 bg-purple-600 rounded-full mb-2" />
      </div>

      {/* Sync Status Messages */}
      {(syncError || syncSuccess) && (
        <div className={`mb-6 p-4 rounded-lg border ${
          syncError
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
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-10">
        <div className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-purple-900/30 p-3 backdrop-blur-sm transition-all hover:border-purple-500/40 md:p-6 animate-scale-in">
          <div className="flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-2 md:mb-0 shadow-lg shadow-purple-500/20">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[10px] md:text-xs font-bold text-purple-400/60 uppercase tracking-wider mb-0.5 md:mb-1">Start</h3>
              <p className="text-[10px] sm:text-xs md:text-base font-black text-white leading-tight">
                {formatDate(battle.startTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-950/40 to-pink-900/30 p-3 backdrop-blur-sm transition-all hover:border-pink-500/40 md:p-6 animate-scale-in delay-75">
          <div className="flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center mb-2 md:mb-0 shadow-lg shadow-pink-500/20">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[10px] md:text-xs font-bold text-pink-400/60 uppercase tracking-wider mb-0.5 md:mb-1">End</h3>
              <p className="text-[10px] sm:text-xs md:text-base font-black text-white leading-tight">
                {formatDate(battle.endTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-purple-900/30 p-3 backdrop-blur-sm transition-all hover:border-purple-500/40 md:p-6 animate-scale-in delay-150">
          <div className="flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-2 md:mb-0 shadow-lg shadow-purple-500/20">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[10px] md:text-xs font-bold text-purple-400/60 uppercase tracking-wider mb-0.5 md:mb-1">Joined</h3>
              <p className="text-sm md:text-base font-black text-white">{battle.participantCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard card */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-purple-900/20 p-6 md:p-8 backdrop-blur-sm mb-6 animate-slide-up">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="relative flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-0 text-white">
              Live Leaderboard
            </h2>
            <p className="text-sm text-purple-300/60 mt-1 font-semibold">Real-time battle standings</p>
          </div>
          {battle.status === 'active' && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-green-500/10 border border-green-500/40 rounded-lg backdrop-blur-sm shadow-lg shadow-green-500/10">
              <span className="inline-block h-3 w-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></span>
              <span className="text-sm font-bold text-green-300 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="relative flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setLeaderboardFilter('all')}
            className={cn(
              'px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base',
              leaderboardFilter === 'all'
                ? 'bg-purple-600 text-white shadow-lg border border-purple-500/50'
                : 'bg-purple-950/30 text-purple-300/60 hover:text-purple-200 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/40'
            )}
          >
            All Participants
          </button>
          <button
            onClick={() => setLeaderboardFilter('teams')}
            className={cn(
              'px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base',
              leaderboardFilter === 'teams'
                ? 'bg-purple-600 text-white shadow-lg border border-purple-500/50'
                : 'bg-purple-950/30 text-purple-300/60 hover:text-purple-200 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/40'
            )}
          >
            Teams Only
          </button>
          <button
            onClick={() => setLeaderboardFilter('solo')}
            className={cn(
              'px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base',
              leaderboardFilter === 'solo'
                ? 'bg-purple-600 text-white shadow-lg border border-purple-500/50'
                : 'bg-purple-950/30 text-purple-300/60 hover:text-purple-200 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/40'
            )}
          >
            Solo Players
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
                        ? 'border-orange-500/50 bg-gradient-to-r from-orange-600/20 to-orange-500/10 shadow-lg shadow-orange-500/10'
                        : entry.isCheater
                        ? 'border-red-500/30 bg-red-950/20'
                        : 'border-purple-500/20 bg-purple-950/30 hover:border-purple-500/40'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 md:gap-4">
                      {/* Rank & Player Info */}
                      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                        {/* Rank Badge */}
                        <div className={cn(
                          'w-8 h-8 md:w-12 md:h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-xs md:text-lg border shadow-lg',
                          rank === 1
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-yellow-500/50 shadow-yellow-500/30'
                            : rank === 2
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white border-gray-400/50 shadow-gray-500/30'
                            : rank === 3
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white border-orange-500/50 shadow-orange-500/30'
                            : 'bg-purple-900/40 text-purple-300 border-purple-500/30 shadow-purple-500/20'
                        )}>
                          {rank <= 3 ? rank : `#${rank}`}
                        </div>

                        {/* Player Details */}
                        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                          <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-xs md:text-sm ${
                            rank === 1 ? 'bg-bts-purple' : 'bg-panel-hover'
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
                      <div className="flex items-center gap-1.5 md:gap-6 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-base sm:text-lg md:text-3xl font-extrabold text-white">
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
      <div className="relative overflow-hidden rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 p-6 backdrop-blur-sm animate-slide-up">
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-yellow-500/10 blur-3xl"></div>
        <div className="relative">
          {/* Main info section */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-purple-200/80 leading-relaxed font-medium">
                {battle.status === 'active' && (
                  <>You can compete as a solo player or create/join a team to combine scores with others!</>
                )}
                {battle.status === 'ended' && (
                  <>Battle has ended. Final results are displayed above. Thank you for participating!</>
                )}
                {battle.status === 'upcoming' && (
                  <>Battle hasn't started yet. Join now to compete when it starts!</>
                )}
              </p>
            </div>
          </div>

          {/* Sync timing info */}
          {battle.status === 'active' && (
            <div className="text-center pt-4 border-t border-yellow-500/20">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-bold text-yellow-200">Running on limited resources</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Scrobbles sync automatically within <span className="text-purple-300 font-bold">5 minutes</span>.
                If not synced, it will update for sure within <span className="text-purple-300 font-bold">15-30 minutes</span> (auto sync).
                <br />
                Not seeing updates? Try the <span className="text-blue-300 font-bold">Manual Sync</span> button above!
                <br />
                <span className="text-xs text-gray-400 mt-1 inline-block">Want faster updates? Consider supporting us to help upgrade the site!</span>
              </p>
              <Link
                href="https://ko-fi.com/noobsambit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span>💜</span>
                <span>Donate</span>
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
    </div>
  );
}
