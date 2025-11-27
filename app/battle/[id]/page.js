'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function BattlePage({ params }) {
  const router = useRouter();
  const [battle, setBattle] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const battleId = params.id;
    fetchLeaderboard(battleId);

    const socketInstance = io({
      path: '/api/socket',
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      socketInstance.emit('join-battle', battleId);
    });

    socketInstance.on('leaderboard-update', (data) => {
      if (data.battleId === battleId) {
        setLeaderboard(data.leaderboard);
        setLastUpdated(data.updatedAt);
      }
    });

    socketInstance.on('battle-ended', (data) => {
      if (data.battleId === battleId) {
        setBattle(prev => ({ ...prev, status: 'ended' }));
        setLeaderboard(data.leaderboard);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(socketInstance);

    const interval = setInterval(() => {
      fetchLeaderboard(battleId);
    }, 10000);

    return () => {
      if (socketInstance) {
        socketInstance.emit('leave-battle', battleId);
        socketInstance.disconnect();
      }
      clearInterval(interval);
    };
  }, [params.id, router]);

  const fetchLeaderboard = async (battleId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/battle/${battleId}/leaderboard`);
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
      {/* Back button with enhanced styling */}
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

      {/* Battle header with gradient */}
      <div className="mb-10 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="hero-title text-gradient">{battle.name}</h1>
          <Badge status={battle.status} className="text-base" />
        </div>
        <div className="h-1 w-32 bg-gradient-to-r from-bts-purple via-bts-pink to-transparent rounded-full mb-2" />
      </div>

      {/* Stats cards with enhanced styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="stat-card animate-scale-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bts-purple/20 to-bts-deep/20 border border-bts-purple/30 flex items-center justify-center shadow-glow-purple">
              <svg className="w-7 h-7 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Start Time</h3>
              <p className="text-lg font-bold text-white">{formatDate(battle.startTime)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card animate-scale-in delay-75">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bts-pink/20 to-bts-pink-light/20 border border-bts-pink/30 flex items-center justify-center shadow-glow-pink">
              <svg className="w-7 h-7 text-bts-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">End Time</h3>
              <p className="text-lg font-bold text-white">{formatDate(battle.endTime)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card animate-scale-in delay-150">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-army-purple-light/20 border border-accent/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Participants</h3>
              <p className="text-lg font-bold text-white">{battle.participantCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard card with enhanced styling */}
      <div className="card p-8 mb-6 animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title mb-0">Live Leaderboard</h2>
            <p className="text-sm text-gray-400 mt-1">Real-time battle standings</p>
          </div>
          {battle.status === 'active' && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <span className="inline-block h-3 w-3 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-sm font-semibold text-green-300 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-panel to-panel-hover border border-border-light rounded-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-bts-purple/20 to-bts-pink/20 border border-bts-purple/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-gray-200 text-xl font-semibold mb-2">No scores yet</p>
            <p className="text-gray-400">Start listening to playlist tracks to see scores!</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-light">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th className="text-right">Streams</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={`${entry.isCheater ? 'bg-yellow-500/5 border-yellow-500/20' : ''}`}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        {index < 3 && (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                            index === 0 ? 'bg-gradient-to-br from-bts-purple to-bts-deep text-white shadow-glow-purple' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300/20 to-gray-400/20 text-gray-300 border border-gray-400/30' :
                            'bg-gradient-to-br from-amber-700/20 to-amber-800/20 text-amber-400 border border-amber-600/30'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                        {index >= 3 && (
                          <span className="w-10 text-center text-xl font-bold text-gray-500">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-glow-purple ${
                          index === 0 ? 'bg-gradient-to-br from-bts-purple to-bts-deep' : 'bg-gradient-to-br from-panel-hover to-border'
                        }`}>
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-100 text-base">{entry.username}</p>
                          {entry.isCheater && (
                            <p className="text-xs text-yellow-400 font-medium flex items-center gap-1 mt-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Suspicious activity
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className={`text-3xl font-extrabold ${
                        index === 0 ? 'text-gradient' : 'text-gray-200'
                      }`}>
                        {entry.count}
                      </span>
                    </td>
                    <td className="text-center">
                      {entry.isCheater ? (
                        <span className="badge badge-ended">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                          Flagged
                        </span>
                      ) : (
                        <span className="badge badge-active">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Info card with enhanced styling */}
      <div className="card-glass p-6 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-bts-purple/20 border border-bts-purple/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-bts-purple" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {battle.status === 'active' && (
                <>Leaderboard updates automatically every 30 seconds via real-time Socket.io connection. Rankings refresh live as participants stream tracks.</>
              )}
              {battle.status === 'ended' && (
                <>Battle has ended. Final results are displayed above. Thank you for participating!</>
              )}
              {battle.status === 'upcoming' && (
                <>Battle hasn't started yet. Check back at the scheduled start time to join the competition.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
