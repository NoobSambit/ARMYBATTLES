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
import ActivityLogModal from '@/components/ActivityLogModal';
import StatisticsDashboard from '@/components/StatisticsDashboard';
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
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

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
        name: data.battleName,
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime,
        participantCount: data.participantCount,
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

      // Refresh the battle data
      await fetchLeaderboard(params.id);
      alert('Battle ended successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setEndingBattle(false);
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
        <button className="btn-secondary mb-8 group">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </span>
        </button>
      </Link>

      {/* Battle header */}
      <div className="mb-10 animate-slide-up">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="hero-title text-bts-purple">{battle.name}</h1>
            <Badge status={battle.status} className="text-base self-start sm:self-auto" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!userInBattle && battle.status !== 'ended' && (
              <button
                onClick={() => setJoinModalOpen(true)}
                className="btn-primary"
              >
                Join Battle
              </button>
            )}
            {isHost && (
              <>
                {battle.status !== 'ended' && (
                  <>
                    <button
                      onClick={() => setExtendModalOpen(true)}
                      className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 text-sm sm:text-base"
                    >
                      <span>⏰</span>
                      <span className="hidden sm:inline">Extend</span>
                    </button>
                    <button
                      onClick={handleEndBattle}
                      disabled={endingBattle}
                      className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold transition-colors duration-200 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {endingBattle ? 'Ending...' : 'End Battle'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setActivityLogOpen(true)}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold transition-colors duration-200 bg-bts-purple text-white hover:bg-bts-deep flex items-center gap-1.5 text-sm sm:text-base"
                >
                  <span>📋</span>
                  <span className="hidden sm:inline">Activity</span>
                </button>
                <button
                  onClick={() => setStatisticsOpen(true)}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold transition-colors duration-200 bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5 text-sm sm:text-base"
                >
                  <span>📊</span>
                  <span className="hidden sm:inline">Stats</span>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="h-1 w-32 bg-bts-purple rounded-full mb-2" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="stat-card animate-scale-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-bts-purple/20 border border-bts-purple/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Start Time</h3>
              <p className="text-lg font-bold text-white">{formatDate(battle.startTime)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card animate-scale-in delay-75">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-bts-pink/20 border border-bts-pink/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-bts-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">End Time</h3>
              <p className="text-lg font-bold text-white">{formatDate(battle.endTime)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card animate-scale-in delay-150">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Participants</h3>
              <p className="text-lg font-bold text-white">{battle.participantCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard card */}
      <div className="card p-8 mb-6 animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title mb-0">Live Leaderboard</h2>
            <p className="text-sm text-gray-400 mt-1">Real-time battle standings</p>
          </div>
          {battle.status === 'active' && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="inline-block h-3 w-3 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-sm font-semibold text-green-300 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setLeaderboardFilter('all')}
            className={cn(
              'px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base',
              leaderboardFilter === 'all'
                ? 'bg-bts-purple text-white'
                : 'bg-surface-light text-gray-400 hover:text-white hover:bg-panel-hover'
            )}
          >
            All Participants
          </button>
          <button
            onClick={() => setLeaderboardFilter('teams')}
            className={cn(
              'px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base',
              leaderboardFilter === 'teams'
                ? 'bg-bts-purple text-white'
                : 'bg-surface-light text-gray-400 hover:text-white hover:bg-panel-hover'
            )}
          >
            Teams Only
          </button>
          <button
            onClick={() => setLeaderboardFilter('solo')}
            className={cn(
              'px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base',
              leaderboardFilter === 'solo'
                ? 'bg-bts-purple text-white'
                : 'bg-surface-light text-gray-400 hover:text-white hover:bg-panel-hover'
            )}
          >
            Solo Players
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-20 bg-panel border border-border-light rounded-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-bts-purple/20 border border-bts-purple/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-gray-200 text-xl font-semibold mb-2">No scores yet</p>
            <p className="text-gray-400">Start listening to playlist tracks to see scores!</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                      'card p-6 transition-colors duration-200',
                      'border-l-4',
                      entry.isCheater
                        ? 'border-l-red-500/70'
                        : 'border-l-blue-500/70'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {/* Rank & Player Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank Badge */}
                        <div className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg',
                          rank <= 3
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-surface-light text-gray-400'
                        )}>
                          {rank === 1 && '👑'}
                          {rank === 2 && '🥈'}
                          {rank === 3 && '🥉'}
                          {rank > 3 && `#${rank}`}
                        </div>

                        {/* Player Details */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${
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
                          <div>
                            <p className="font-bold text-gray-100 text-base">
                              {entry.displayName || entry.username}
                            </p>
                            <p className="text-sm text-muted">@{entry.username}</p>
                            {entry.isCheater && (
                              <p className="text-xs text-red-400 font-medium flex items-center gap-1 mt-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Suspicious activity
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-white">
                            {entry.count}
                          </div>
                          <div className="text-xs text-muted uppercase tracking-wider">
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
                            className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all duration-200 text-sm font-medium"
                            title="Remove participant"
                          >
                            ⚠️ Remove
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

        {lastUpdated && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {formatDate(lastUpdated)}
            </p>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="card-glass p-6 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-bts-purple/20 border border-bts-purple/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-bts-purple" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {battle.status === 'active' && (
                <>Leaderboard updates automatically every 2 minutes. You can compete as a solo player or create/join a team to combine scores with others!</>
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

      <ActivityLogModal
        isOpen={activityLogOpen}
        onClose={() => setActivityLogOpen(false)}
        battleId={params.id}
      />

      <StatisticsDashboard
        isOpen={statisticsOpen}
        onClose={() => setStatisticsOpen(false)}
        battleId={params.id}
      />
    </div>
  );
}
