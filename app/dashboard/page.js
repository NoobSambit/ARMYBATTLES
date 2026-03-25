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
            Loading Dashboard
          </h3>
          <p className="text-bts-blue-light uppercase tracking-[0.3em] text-sm font-bold flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-bts-blue animate-ping"></span>
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-32 pb-12 relative overflow-hidden bg-background-dark text-slate-100">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7b2cbf]/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#c77dff]/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="mb-10 text-center sm:text-left">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 mb-2 tracking-tight drop-shadow-sm">Dashboard</h1>
          <p className="text-gray-400 font-medium tracking-wide">Manage your battles and profile</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/25 text-green-300 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Profile Card */}
          <div className="bg-[#090b14] border border-[#7b2cbf]/20 rounded-2xl p-6 md:p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:border-[#7b2cbf]/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7b2cbf]/10 rounded-full blur-3xl group-hover:bg-[#c77dff]/20 transition-all duration-500"></div>

            <h3 className="text-lg font-black text-gray-200 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c77dff]">account_circle</span>
              Profile
            </h3>
            <div className="space-y-5 relative z-10">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Username</p>
                <p className="font-black text-xl text-white tracking-wide">{user.username}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  {user.trackingServiceLabel || 'Tracking Service'}
                </p>
                {user.trackingUsername ? (
                  <div>
                    <p className="font-black text-lg text-[#e0aaff] tracking-wide">{user.trackingUsername}</p>
                    {user.trackingProfileUrl && (
                      <a
                        href={user.trackingProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#c77dff] hover:text-white transition-colors uppercase tracking-widest inline-flex items-center gap-1 mt-1.5"
                      >
                        View Profile <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    )}
                    {!user.supportsBattleVerification && (
                      <p className="mt-2 inline-block rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold tracking-wide text-yellow-300">
                        Login only. Battle verification is not available for this service yet.
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      One tracker is connected at a time. Log out and sign back in to switch services.
                    </p>
                  </div>
                ) : (
                  <p className="font-bold text-yellow-500/80 text-sm tracking-wide bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 inline-block">Not connected</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-[#090b14] border border-[#7b2cbf]/20 rounded-2xl p-6 md:p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:border-[#7b2cbf]/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c77dff]/10 rounded-full blur-3xl group-hover:bg-[#9d4edd]/20 transition-all duration-500"></div>

            <h3 className="text-lg font-black text-gray-200 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#e0aaff]">bolt</span>
              Quick Actions
            </h3>
            <div className="space-y-3 relative z-10">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full group/btn relative overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(123,44,191,0.2)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(199,125,255,0.3)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover/btn:w-full z-0"></div>
                <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase text-sm">
                  <span className="material-symbols-outlined text-[1.2rem]">add_circle</span>
                  Create New Battle
                </span>
              </button>
              <Link href="/battles" className="block">
                <button className="w-full group/btn relative overflow-hidden bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-white/30 font-bold py-3.5 rounded-xl transition-all duration-300">
                  <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase text-sm">
                    <span className="material-symbols-outlined text-[1.2rem]">travel_explore</span>
                    Browse All Battles
                  </span>
                </button>
              </Link>
              <button
                onClick={() => handleLogout()}
                className="w-full group/btn relative overflow-hidden bg-red-500/5 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500/50 font-bold py-3.5 rounded-xl transition-all duration-300 hover:bg-red-500/20"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase text-sm">
                  <span className="material-symbols-outlined text-[1.2rem]">logout</span>
                  Logout
                </span>
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-[#090b14] border border-[#7b2cbf]/20 rounded-2xl p-6 md:p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:border-[#7b2cbf]/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#9d4edd]/10 rounded-full blur-3xl group-hover:bg-[#c77dff]/20 transition-all duration-500"></div>

            <h3 className="text-lg font-black text-gray-200 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c77dff]">monitoring</span>
              Stats
            </h3>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Battles</span>
                <span className="font-black text-3xl text-transparent bg-clip-text bg-gradient-to-br from-white to-[#c77dff]">{userBattles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Active Now</span>
                <span className="font-black text-3xl text-transparent bg-clip-text bg-gradient-to-br from-green-300 to-emerald-500 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                  {userBattles.filter(b => b.status === 'active').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6 drop-shadow-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-[#c77dff] text-[1.5rem] sm:text-[2rem]">swords</span>
            Your Battles
          </h2>

          {userBattles.length > 0 && (
            <>
              <div className="mb-6">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search your battles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3.5 pl-12 bg-black/40 border border-[#7b2cbf]/30 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium group-hover:border-[#7b2cbf]/50"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#c77dff] transition-colors">
                    search
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <nav className="flex space-x-2 overflow-x-auto p-1.5 bg-[#090b14]/80 border border-white/5 rounded-2xl custom-scrollbar relative z-10">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-2.5 py-2.5 px-5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap tracking-wide',
                        activeTab === tab.id
                          ? 'bg-[#7b2cbf] text-white shadow-[0_0_15px_rgba(123,44,191,0.4)]'
                          : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <span>{tab.label}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-lg text-[10px] font-black',
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-gray-400'
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
            <div className="flex flex-col items-center justify-center py-20 bg-[#090b14] border border-[#7b2cbf]/20 rounded-2xl animate-pulse-slow shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-bts-purple/10 rounded-full"></div>
                <div className="absolute inset-0 border-[4px] border-bts-pink rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1.2s' }}></div>
                <div className="absolute inset-3 border-4 border-bts-blue/40 rounded-full border-b-transparent animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-bts-purple animate-pulse drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                    radar
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-bts-purple to-bts-pink mb-2 uppercase drop-shadow-sm">
                Fetching Data
              </h3>
              <p className="text-bts-blue-light uppercase tracking-[0.3em] text-[10px] font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-bts-blue animate-ping"></span>
                Scanning for Battles...
              </p>
            </div>
          ) : userBattles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#090b14] border border-[#7b2cbf]/20 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#c77dff]/10 rounded-full blur-[60px] pointer-events-none transition-all duration-500 group-hover:bg-[#9d4edd]/20"></div>
              <div className="w-24 h-24 mb-6 rounded-full bg-black/40 border border-[#7b2cbf]/30 flex items-center justify-center shadow-[0_0_20px_rgba(123,44,191,0.2)]">
                <span className="material-symbols-outlined text-5xl text-gray-500 group-hover:text-[#c77dff] transition-colors">
                  videogame_asset_off
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Battles Found</h3>
              <p className="text-gray-400 mb-8 font-medium">Join or create a battle to get started!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="group/btn relative overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-3.5 px-8 rounded-xl shadow-[0_0_20px_rgba(123,44,191,0.2)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(199,125,255,0.3)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover/btn:w-full z-0"></div>
                <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase text-sm">
                  <span className="material-symbols-outlined text-[1.2rem]">add_circle</span>
                  Create Battle
                </span>
              </button>
            </div>
          ) : filteredUserBattles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#090b14] border border-[#7b2cbf]/20 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#c77dff]/10 rounded-full blur-[60px] pointer-events-none transition-all duration-500 group-hover:bg-[#9d4edd]/20"></div>
              <div className="w-24 h-24 mb-6 rounded-full bg-black/40 border border-[#7b2cbf]/30 flex items-center justify-center shadow-[0_0_20px_rgba(123,44,191,0.2)]">
                <span className="material-symbols-outlined text-5xl text-gray-500 group-hover:text-[#c77dff] transition-colors">
                  search_off
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Battles Match Your Search</h3>
              <p className="text-gray-400 font-medium">Try a different search term or category.</p>
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
              <label className="block text-xs font-black tracking-widest text-[#c77dff] uppercase mb-2">
                Battle Name
              </label>
              <input
                type="text"
                placeholder="e.g., BTS Album Battle"
                value={battleForm.name}
                onChange={(e) => setBattleForm({ ...battleForm, name: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-widest text-[#c77dff] uppercase mb-2">
                Description <span className="text-gray-500 font-bold">(Optional)</span>
              </label>
              <textarea
                placeholder="Describe your battle..."
                value={battleForm.description}
                onChange={(e) => setBattleForm({ ...battleForm, description: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium resize-none"
              />
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1.5">{battleForm.description.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-xs font-black tracking-widest text-[#c77dff] uppercase mb-2">
                Goal <span className="text-gray-500 font-bold">(Total Scrobbles)</span> <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 1000"
                value={battleForm.goal}
                onChange={(e) => setBattleForm({ ...battleForm, goal: e.target.value })}
                required
                min="1"
                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium"
              />
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1.5">Target number of total scrobbles to reach</p>
            </div>

            <div>
              <label className="block text-xs font-black tracking-widest text-[#c77dff] uppercase mb-2">
                Spotify Playlist URL or ID
              </label>
              <input
                type="text"
                placeholder="https://open.spotify.com/playlist/..."
                value={battleForm.spotifyPlaylist}
                onChange={(e) => setBattleForm({ ...battleForm, spotifyPlaylist: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black tracking-widest text-[#c77dff] uppercase mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={battleForm.startTime}
                  onChange={(e) => setBattleForm({ ...battleForm, startTime: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all font-medium [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-widest text-[#c77dff] uppercase mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={battleForm.endTime}
                  onChange={(e) => setBattleForm({ ...battleForm, endTime: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all font-medium [color-scheme:dark]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingBattle}
              className="group relative w-full overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:-translate-y-1 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {!creatingBattle && <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>}
              <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase">
                {creatingBattle ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    <span>CREATING...</span>
                  </>
                ) : (
                  'CREATE BATTLE'
                )}
              </span>
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
