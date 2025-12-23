'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/Modal';
import BattleCard from '@/components/BattleCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getBattleStatus, cn } from '@/lib/utils';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [battles, setBattles] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [battleForm, setBattleForm] = useState({
    name: '',
    description: '',
    goal: '',
    spotifyPlaylist: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingBattle, setCreatingBattle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [loadingBattles, setLoadingBattles] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (err) {
        localStorage.removeItem('user');
      }
    }

    fetchUser();
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

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        await handleLogout(true);
        return;
      }

      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  const fetchBattles = async () => {
    try {
      setLoadingBattles(true);
      const res = await fetch('/api/battle/list');
      const data = await res.json();
      if (res.ok) {
        setBattles(data.battles);
      }
    } catch (err) {
      console.error('Failed to fetch battles:', err);
    } finally {
      setLoadingBattles(false);
    }
  };

  const handleLogout = async (silent = false) => {
    const token = localStorage.getItem('token');

    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to log out:', err);
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const handleBattleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setCreatingBattle(true);

    try {
      const token = localStorage.getItem('token');

      // Convert datetime-local values to UTC ISO strings
      // This ensures the time entered in user's local timezone is correctly stored as UTC
      const convertToUTC = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;
        // Create a date object from the local datetime string
        // This interprets it as the user's local timezone
        const localDate = new Date(dateTimeLocal);
        // Convert to ISO string (UTC)
        return localDate.toISOString();
      };

      const payload = {
        ...battleForm,
        goal: parseInt(battleForm.goal, 10),
        startTime: convertToUTC(battleForm.startTime),
        endTime: convertToUTC(battleForm.endTime),
      };

      const res = await fetch('/api/battle/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create battle');
      }

      // Immediately add the new battle to the list (optimistic update)
      if (data.battle) {
        setBattles(prev => [data.battle, ...prev]);
      }

      setSuccess('Battle created successfully!');
      setShowCreateForm(false);
      setBattleForm({ name: '', description: '', goal: '', spotifyPlaylist: '', startTime: '', endTime: '' });

      // Still fetch to ensure we have the latest data
      setTimeout(() => fetchBattles(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingBattle(false);
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

  // Filter to show only user's battles (joined or hosted)
  const userBattles = battlesWithStatus.filter(battle => {
    if (!user) return false;

    // Check if user is the host
    const isHost = battle.hostId === user.id;

    // Check if user is a participant
    const isParticipant = battle.participants?.some(p => p.userId === user.id);

    return isHost || isParticipant;
  });

  // Apply tab filter and search filter
  const filteredUserBattles = userBattles.filter(battle => {
    // Filter by tab
    const matchesTab = activeTab === 'all' || battle.status === activeTab;

    // Filter by search query
    const matchesSearch = searchQuery.trim() === '' ||
      battle.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ended', label: 'Ended' },
  ];

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
        <h1 className="font-display text-4xl font-bold text-gradient mb-2">Dashboard</h1>
        <p className="text-gray-400">Manage your battles and profile</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-500/10 border border-green-500/25 text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Profile</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Username</p>
              <p className="font-medium text-gray-100">{user.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Last.fm</p>
              {user.lastfmUsername ? (
                <div>
                  <p className="font-medium text-green-300">{user.lastfmUsername}</p>
                  {user.lastfmProfileUrl && (
                    <a
                      href={user.lastfmProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-bts-pink-bright hover:text-bts-pink underline mt-1 inline-block"
                    >
                      View Profile
                    </a>
                  )}
                </div>
              ) : (
                <p className="font-medium text-orange-300">Not connected</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary w-full"
            >
              Create New Battle
            </button>
            <Link href="/battles">
              <button className="btn-secondary w-full">
                Browse All Battles
              </button>
            </Link>
            <button
              onClick={() => handleLogout()}
              className="btn-outline w-full"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total Battles</span>
              <span className="font-bold text-2xl text-bts-purple">{userBattles.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Active Now</span>
              <span className="font-bold text-2xl text-green-300">
                {userBattles.filter(b => b.status === 'active').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="section-title">Your Battles</h2>

        {userBattles.length > 0 && (
          <>
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your battles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-panel/50 backdrop-blur-sm border border-border-light rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-bts-purple/50 transition-colors"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="mb-6">
              <nav className="flex space-x-2 overflow-x-auto p-1 bg-panel/50 backdrop-blur-sm border border-border-light rounded-2xl">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-3 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 text-white border border-bts-purple/30 shadow-glow-purple'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-panel-hover'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold',
                      activeTab === tab.id
                        ? 'bg-bts-purple/30 text-white'
                        : 'bg-panel-hover border border-border-light text-gray-300'
                    )}>
                      {tab.id === 'all' ? userBattles.length : userBattles.filter(b => b.status === tab.id).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}

        {loadingBattles ? (
          <div className="text-center py-12 bg-panel border border-border rounded-lg animate-pulse">
            <div className="flex justify-center mb-4">
              <LoadingSpinner size="lg" />
            </div>
            <p className="text-gray-400">Loading your battles...</p>
          </div>
        ) : userBattles.length === 0 ? (
          <div className="text-center py-12 bg-panel border border-border rounded-lg">
            <p className="text-gray-300 text-lg">No battles found</p>
            <p className="text-gray-400 mt-2">Join or create a battle to get started!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary mt-4"
            >
              Create Battle
            </button>
          </div>
        ) : filteredUserBattles.length === 0 ? (
          <div className="text-center py-12 bg-panel border border-border rounded-lg">
            <p className="text-gray-300 text-lg">No battles match your search</p>
            <p className="text-gray-400 mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUserBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setError('');
          setBattleForm({ name: '', description: '', goal: '', spotifyPlaylist: '', startTime: '', endTime: '' });
        }}
        title="Create New Battle"
        size="md"
      >
        <form onSubmit={handleBattleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <textarea
              placeholder="Describe your battle..."
              value={battleForm.description}
              onChange={(e) => setBattleForm({ ...battleForm, description: e.target.value })}
              rows={3}
              maxLength={500}
              className="input-field resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{battleForm.description.length}/500 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Goal (Total Scrobbles/Streams) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 1000"
              value={battleForm.goal}
              onChange={(e) => setBattleForm({ ...battleForm, goal: e.target.value })}
              required
              min="1"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">Target number of total scrobbles/streams to reach</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
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

          <button type="submit" disabled={creatingBattle} className="btn-primary w-full">
            {creatingBattle ? 'Creating...' : 'Create Battle'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
