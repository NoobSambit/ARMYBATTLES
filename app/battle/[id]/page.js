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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
        <Link href="/dashboard">
          <button className="btn-secondary">← Back to Dashboard</button>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/dashboard">
        <button className="btn-secondary mb-6">← Back to Dashboard</button>
      </Link>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h1 className="text-4xl font-bold text-gradient mb-2 sm:mb-0">{battle.name}</h1>
          <Badge status={battle.status} className="text-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-army-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatDate(battle.startTime)}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-army-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-500">End Time</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatDate(battle.endTime)}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-army-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-500">Participants</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900">{battle.participantCount}</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Live Leaderboard</h2>
          {battle.status === 'active' && (
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm text-gray-600">Live Updating...</span>
            </div>
          )}
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No scores yet</p>
            <p className="text-gray-500 mt-2">Start listening to playlist tracks to see scores!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-purple text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Username</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Streams</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      entry.isCheater ? 'bg-yellow-50' : 'hover:bg-gray-50'
                    } ${index === 0 && !entry.isCheater ? 'bg-purple-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <span className={`text-2xl font-bold ${
                        index === 0 ? 'text-army-purple' : 
                        index === 1 ? 'text-gray-600' : 
                        index === 2 ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-purple rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{entry.username}</p>
                          {entry.isCheater && (
                            <p className="text-xs text-yellow-700 flex items-center mt-1">
                              <span className="mr-1">⚠️</span>
                              Suspicious activity detected
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-2xl font-bold text-army-purple">{entry.count}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {entry.isCheater ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Flagged
                        </span>
                      ) : (
                        <span className="text-green-500 text-xl">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastUpdated && (
          <p className="mt-4 text-sm text-gray-500 text-center">
            Last updated: {formatDate(lastUpdated)}
          </p>
        )}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-800 flex items-center">
          {battle.status === 'active' && (
            <>
              <span className="mr-2">🔴</span>
              Leaderboard updates automatically every 30 seconds via real-time Socket.io connection
            </>
          )}
          {battle.status === 'ended' && (
            <>
              <span className="mr-2">✓</span>
              Battle has ended. Final results are shown above.
            </>
          )}
          {battle.status === 'upcoming' && (
            <>
              <span className="mr-2">📅</span>
              Battle hasn't started yet. Check back at the start time!
            </>
          )}
        </p>
      </div>
    </div>
  );
}
