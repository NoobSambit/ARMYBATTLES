'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';

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
      <div style={{ maxWidth: '800px', margin: '20px auto' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <Link href="/dashboard">
          <button style={{ padding: '10px 20px', marginTop: '10px' }}>Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  if (!battle) {
    return <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading battle...</div>
      </div>
    </div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <Link href="/dashboard">
        <button style={{ padding: '10px 20px', marginBottom: '20px' }}>← Back to Dashboard</button>
      </Link>

      <h1>{battle.name}</h1>
      
      <div style={{ backgroundColor: 'white', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <p><strong>Status:</strong> <span style={{ textTransform: 'uppercase', color: battle.status === 'active' ? 'green' : battle.status === 'ended' ? 'red' : 'orange' }}>{battle.status}</span></p>
        <p><strong>Start Time:</strong> {new Date(battle.startTime).toLocaleString()}</p>
        <p><strong>End Time:</strong> {new Date(battle.endTime).toLocaleString()}</p>
        <p><strong>Participants:</strong> {battle.participantCount}</p>
        {lastUpdated && <p style={{ fontSize: '14px', color: '#666' }}><strong>Last Updated:</strong> {new Date(lastUpdated).toLocaleString()}</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>Live Leaderboard</h2>
        {loading && <span style={{ color: '#666', fontSize: '14px' }}>Verifying streams...</span>}
      </div>

      {leaderboard.length === 0 ? (
        <p style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px' }}>No scores yet. Start listening to playlist tracks!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Rank</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Username</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Scrobble Count</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.userId} style={{ borderBottom: '1px solid #ddd', backgroundColor: entry.isCheater ? '#fff3cd' : 'white' }}>
                <td style={{ padding: '10px' }}>{index + 1}</td>
                <td style={{ padding: '10px' }}>
                  {entry.username}
                  {entry.isCheater && <span style={{ marginLeft: '5px', color: '#856404', fontSize: '12px' }}>⚠️</span>}
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{entry.count}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  {entry.isCheater ? <span style={{ color: '#856404', fontSize: '12px' }}>Flagged</span> : '✓'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        {battle.status === 'active' && '🔴 Leaderboard updates automatically every 30 seconds'}
        {battle.status === 'ended' && 'Battle has ended. Final results shown.'}
        {battle.status === 'upcoming' && 'Battle hasn\'t started yet.'}
      </p>
    </div>
  );
}
