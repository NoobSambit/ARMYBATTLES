'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/Modal';
import BattleCard from '@/components/BattleCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getBattleStatus } from '@/lib/utils';

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

  const battlesWithStatus = battles.map(battle => ({
    ...battle,
    status: getBattleStatus(battle),
  }));

  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your battles and profile</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium text-gray-900">{user.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last.fm</p>
              {user.lastfmUsername ? (
                <p className="font-medium text-green-600 flex items-center">
                  <span className="mr-2">✓</span>
                  {user.lastfmUsername}
                </p>
              ) : (
                <p className="font-medium text-orange-500">Not connected</p>
              )}
            </div>
            <button
              onClick={() => setShowLastfmForm(true)}
              className="btn-secondary w-full mt-4"
            >
              {user.lastfmUsername ? 'Update Last.fm' : 'Connect Last.fm'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary w-full"
            >
              🎵 Create New Battle
            </button>
            <Link href="/battles">
              <button className="btn-secondary w-full">
                📋 Browse All Battles
              </button>
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Battles</span>
              <span className="font-bold text-2xl text-army-purple">{battles.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Active Now</span>
              <span className="font-bold text-2xl text-green-600">
                {battlesWithStatus.filter(b => b.status === 'active').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="section-title">Your Battles</h2>
        {battles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No battles available</p>
            <p className="text-gray-500 mt-2">Create your first battle to get started!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary mt-4"
            >
              Create Battle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {battlesWithStatus.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showLastfmForm}
        onClose={() => {
          setShowLastfmForm(false);
          setError('');
        }}
        title="Connect Last.fm Account"
        size="sm"
      >
        <form onSubmit={handleLastfmSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last.fm Username
            </label>
            <input
              type="text"
              placeholder="Enter your Last.fm username"
              value={lastfmUsername}
              onChange={(e) => setLastfmUsername(e.target.value)}
              required
              className="input-field"
            />
            <p className="mt-2 text-sm text-gray-500">
              Don't have a Last.fm account?{' '}
              <a
                href="https://www.last.fm/join"
                target="_blank"
                rel="noopener noreferrer"
                className="text-army-purple hover:underline"
              >
                Create one here
              </a>
            </p>
          </div>
          <button type="submit" className="btn-primary w-full">
            Save Username
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setError('');
          setBattleForm({ name: '', spotifyPlaylist: '', startTime: '', endTime: '' });
        }}
        title="Create New Battle"
        size="md"
      >
        <form onSubmit={handleBattleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Battle Name
            </label>
            <input
              type="text"
              placeholder="e.g., BTS Album Battle"
              value={battleForm.name}
              onChange={(e) => setBattleForm({ ...battleForm, name: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spotify Playlist URL or ID
            </label>
            <input
              type="text"
              placeholder="https://open.spotify.com/playlist/..."
              value={battleForm.spotifyPlaylist}
              onChange={(e) => setBattleForm({ ...battleForm, spotifyPlaylist: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={battleForm.startTime}
                onChange={(e) => setBattleForm({ ...battleForm, startTime: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={battleForm.endTime}
                onChange={(e) => setBattleForm({ ...battleForm, endTime: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create Battle'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
