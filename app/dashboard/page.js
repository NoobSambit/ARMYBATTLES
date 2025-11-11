'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [battles, setBattles] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLastfmForm, setShowLastfmForm] = useState(false);
  const [lastfmUsername, setLastfmUsername] = useState('');
  const [battleForm, setBattleForm] = useState({
    name: '',
    spotifyPlaylist: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setLastfmUsername(parsedUser.lastfmUsername || '');
    }

    fetchBattles();
    startVerification();
  }, [router]);

  const startVerification = async () => {
    try {
      await fetch('/api/battle/verify', { method: 'POST' });
    } catch (err) {
      console.error('Failed to start verification:', err);
    }
  };

  const fetchBattles = async () => {
    try {
      const res = await fetch('/api/battle/list');
      const data = await res.json();
      if (res.ok) {
        setBattles(data.battles);
      }
    } catch (err) {
      console.error('Failed to fetch battles:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleLastfmSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/lastfm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ lastfmUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update Last.fm username');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setSuccess('Last.fm username updated successfully!');
      setShowLastfmForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBattleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/battle/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(battleForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create battle');
      }

      setSuccess('Battle created successfully!');
      setShowCreateForm(false);
      setBattleForm({ name: '', spotifyPlaylist: '', startTime: '', endTime: '' });
      fetchBattles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinBattle = async (battleId) => {
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/battle/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ battleId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join battle');
      }

      setSuccess('Joined battle successfully!');
      fetchBattles();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>Logout</button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p>
          <strong>Last.fm:</strong> {user.lastfmUsername ? (
            <span style={{ color: 'green' }}>
              {user.lastfmUsername} <span style={{ marginLeft: '5px' }}>✓</span> Connected
            </span>
          ) : (
            <span style={{ color: 'orange' }}>Not connected</span>
          )}
        </p>
        <button onClick={() => setShowLastfmForm(!showLastfmForm)} style={{ padding: '8px 16px', marginTop: '10px' }}>
          {user.lastfmUsername ? 'Update Last.fm Username' : 'Connect Last.fm Account'}
        </button>
      </div>

      {showLastfmForm && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3>Set Last.fm Username</h3>
          <form onSubmit={handleLastfmSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Last.fm Username"
              value={lastfmUsername}
              onChange={(e) => setLastfmUsername(e.target.value)}
              required
              style={{ padding: '10px', fontSize: '16px' }}
            />
            <button type="submit" style={{ padding: '10px', fontSize: '16px' }}>Save</button>
          </form>
        </div>
      )}

      {error && <p style={{ color: 'red', padding: '10px', backgroundColor: 'white' }}>{error}</p>}
      {success && <p style={{ color: 'green', padding: '10px', backgroundColor: 'white' }}>{success}</p>}

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}>
          Create Battle
        </button>
      </div>

      {showCreateForm && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3>Create New Battle</h3>
          <form onSubmit={handleBattleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Battle Name"
              value={battleForm.name}
              onChange={(e) => setBattleForm({ ...battleForm, name: e.target.value })}
              required
              style={{ padding: '10px', fontSize: '16px' }}
            />
            <input
              type="text"
              placeholder="Spotify Playlist URL or ID"
              value={battleForm.spotifyPlaylist}
              onChange={(e) => setBattleForm({ ...battleForm, spotifyPlaylist: e.target.value })}
              required
              style={{ padding: '10px', fontSize: '16px' }}
            />
            <input
              type="datetime-local"
              placeholder="Start Time"
              value={battleForm.startTime}
              onChange={(e) => setBattleForm({ ...battleForm, startTime: e.target.value })}
              required
              style={{ padding: '10px', fontSize: '16px' }}
            />
            <input
              type="datetime-local"
              placeholder="End Time"
              value={battleForm.endTime}
              onChange={(e) => setBattleForm({ ...battleForm, endTime: e.target.value })}
              required
              style={{ padding: '10px', fontSize: '16px' }}
            />
            <button type="submit" style={{ padding: '10px', fontSize: '16px' }}>Create Battle</button>
          </form>
        </div>
      )}

      <h2>Available Battles</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {battles.length === 0 ? (
          <p>No battles available. Create one!</p>
        ) : (
          battles.map((battle) => (
            <div key={battle.id} style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
              <h3>{battle.name}</h3>
              <p><strong>Host:</strong> {battle.host}</p>
              <p><strong>Status:</strong> {battle.status}</p>
              <p><strong>Participants:</strong> {battle.participantCount}</p>
              <p><strong>Tracks:</strong> {battle.trackCount}</p>
              <p><strong>Start:</strong> {new Date(battle.startTime).toLocaleString()}</p>
              <p><strong>End:</strong> {new Date(battle.endTime).toLocaleString()}</p>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleJoinBattle(battle.id)} style={{ padding: '8px 16px', marginRight: '10px' }}>
                  Join Battle
                </button>
                <Link href={`/battle/${battle.id}`}>
                  <button style={{ padding: '8px 16px' }}>View Battle</button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
