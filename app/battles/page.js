'use client';

import { useEffect, useState } from 'react';
import BattleCard from '@/components/BattleCard';
import { getBattleStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';

export default function BattlesPage() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modal State
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

  useEffect(() => {
    fetchBattles();
  }, []);

  const fetchBattles = async () => {
    try {
      const res = await fetch('/api/battle/list');
      const data = await res.json();
      if (res.ok) {
        const battlesWithStatus = data.battles.map(battle => ({
          ...battle,
          status: getBattleStatus(battle),
        }));
        setBattles(battlesWithStatus);
      }
    } catch (err) {
      console.error('Failed to fetch battles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBattleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setCreatingBattle(true);

    try {
      const token = localStorage.getItem('token');

      const convertToUTC = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;
        const localDate = new Date(dateTimeLocal);
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

      if (data.battle) {
        setBattles(prev => [data.battle, ...prev]);
      }

      setSuccess('Battle created successfully!');
      setShowCreateForm(false);
      setBattleForm({ name: '', description: '', goal: '', spotifyPlaylist: '', startTime: '', endTime: '' });

      setTimeout(() => fetchBattles(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingBattle(false);
    }
  };

  const filteredBattles = battles.filter(battle => {
    // Filter by tab
    const matchesTab = activeTab === 'all' || battle.status === activeTab;

    // Filter by search query
    const matchesSearch = searchQuery.trim() === '' ||
      battle.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Sort logic
  const sortedBattles = [...filteredBattles].sort((a, b) => {
    if (sortBy === 'starting_soon') {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }
    if (sortBy === 'highest_prize') {
      return (b.prizePool || 0) - (a.prizePool || 0);
    }
    if (sortBy === 'most_players') {
      return (b.players?.length || 0) - (a.players?.length || 0);
    }
    // Newest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tabs = [
    { id: 'all', label: 'All Battles', icon: 'public' },
    { id: 'active', label: 'Active', icon: 'bolt' },
    { id: 'upcoming', label: 'Upcoming', icon: 'schedule' },
    { id: 'ended', label: 'Ended', icon: 'history' },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] w-full relative overflow-hidden bg-background-dark selection:bg-bts-pink selection:text-white pb-24">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-bts-purple/15 rounded-full blur-[160px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-bts-pink/10 rounded-full blur-[150px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />
        {/* Subtle overlay grid for texture */}
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.04] mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 md:pt-36 relative z-10 antialiased">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-16 animate-slide-up">
          <div className="relative">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-white tracking-tighter mb-4 sm:mb-5 text-left leading-[1.05] drop-shadow-lg flex items-center gap-3 sm:gap-4">
              <span className="font-black drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]">BATTLE</span>
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-[#f3e8ff] via-[#d8b4fe] to-[#9333ea] drop-shadow-[0_0_35px_rgba(168,85,247,0.6)] animate-pulse-slow">ARENA</span>
            </h1>
            <div className="flex items-center gap-3 border-l-4 border-[#a855f7] pl-4 sm:pl-5 py-1 sm:py-2">
              <p className="text-sm sm:text-base md:text-lg text-gray-300 font-medium tracking-wide">
                Enter the arena. Prove your worth.<br className="hidden sm:block" /> Claim the ultimate glory.
              </p>
            </div>
          </div>

          <button onClick={() => setShowCreateForm(true)} className="group relative inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 font-black transition-all duration-500 bg-surface/50 text-[#c77dff] hover:text-white border-2 border-[#7b2cbf] hover:border-[#c77dff] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(123,44,191,0.2)] hover:shadow-[0_0_40px_rgba(199,125,255,0.4)] active:scale-95 w-full lg:w-auto text-sm sm:text-base cursor-pointer transform hover:-translate-y-1">
            <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
            <span className="relative z-10 flex items-center gap-2 sm:gap-3 tracking-wider">
              <span className="material-symbols-outlined text-xl sm:text-2xl group-hover:rotate-12 transition-transform duration-300">swords</span>
              INITIATE BATTLE
            </span>
          </button>
        </div>

        {/* Command Center (Search, Filter & Tabs) */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-2 sm:p-4 mb-10 sm:mb-14 shadow-card-premium border border-border-light/40 backdrop-blur-2xl animate-slide-up z-20 relative" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5">

            {/* Tabs */}
            <nav className="flex space-x-1.5 w-full xl:w-auto overflow-x-auto p-1.5 bg-background-dark/80 rounded-xl border border-white/5 shadow-inner hide-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const count = tab.id === 'all' ? battles.length : battles.filter(b => b.status === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2.5 py-2 px-3 sm:py-2.5 sm:px-5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap relative group',
                      isActive
                        ? 'text-white bg-surface border-b-2 border-bts-pink shadow-card-premium transform -translate-y-[1px] sm:-translate-y-[2px]'
                        : 'text-gray-400 hover:text-white hover:bg-panel/50'
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-t from-bts-pink/20 to-transparent rounded-lg pointer-events-none" />
                    )}
                    <span className={cn('material-symbols-outlined text-sm sm:text-base transition-colors', isActive ? 'text-bts-pink drop-shadow-glow-pink' : 'text-gray-500 group-hover:text-gray-300')}>
                      {tab.icon}
                    </span>
                    <span className="relative z-10 tracking-wider sm:tracking-widest uppercase">{tab.label}</span>
                    <span className={cn(
                      'relative z-10 px-1.5 sm:px-2 py-0.5 rounded-md text-[0.65rem] sm:text-xs font-black transition-colors transform group-hover:scale-110 ml-0.5 sm:ml-1',
                      isActive
                        ? 'bg-gradient-to-r from-bts-purple to-bts-pink text-white shadow-glow'
                        : 'bg-surface-elevated border border-border text-gray-400 group-hover:text-white group-hover:border-border-light'
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto xl:flex-1 justify-end">
              {/* Search */}
              <div className="relative group w-full xl:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-500 group-focus-within:text-bts-pink transition-colors text-xl">
                    radar
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Scan for engagements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-dark/90 text-white pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-border/80 focus:border-bts-pink focus:ring-4 focus:ring-bts-pink/10 focus:outline-none transition-all duration-300 placeholder-gray-600 font-medium text-sm sm:text-base shadow-inner group-hover:border-border-light"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative group w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-500 group-focus-within:text-bts-purple transition-colors text-xl">
                    tune
                  </span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-surface-dark/90 text-gray-200 pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-border/80 focus:border-bts-purple focus:ring-4 focus:ring-bts-purple/10 focus:outline-none transition-all duration-300 cursor-pointer font-medium text-sm sm:text-base shadow-inner group-hover:border-border-light"
                >
                  <option value="newest">Newest First</option>
                  <option value="starting_soon">Starting Soon</option>
                  <option value="highest_prize">Highest Goal</option>
                  <option value="most_players">Most Participants</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 sm:px-3 pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-lg">
                    unfold_more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        {loading ? (
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
              Loading Data
            </h3>
            <p className="text-bts-blue-light uppercase tracking-[0.3em] text-sm font-bold flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-bts-blue animate-ping"></span>
              Connecting...
            </p>
          </div>
        ) : sortedBattles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10 animate-slide-up w-full" style={{ animationDelay: '0.2s' }}>
            {sortedBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center glass-card rounded-[2.5rem] animate-scale-in border border-white/5 shadow-card-premium relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>

            <div className="w-32 h-32 mb-10 rounded-full bg-gradient-to-br from-panel-elevated to-panel border-4 border-panel-hover shadow-tactical flex items-center justify-center relative transform group-hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-[#7b2cbf]/10 blur-2xl rounded-full group-hover:bg-[#9d4edd]/20 group-hover:blur-3xl transition-all duration-500"></div>
              <span className="material-symbols-outlined text-7xl text-gray-500 group-hover:text-[#c77dff] transition-colors relative z-10 drop-shadow-lg lg:text-[5rem]">
                sports_esports
              </span>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background-dark border-2 border-border-light flex items-center justify-center shadow-lg">
                <span className="w-4 h-4 rounded-full bg-danger animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
              </div>
            </div>

            <h3 className="text-5xl font-display font-black text-white mb-5 tracking-tight drop-shadow-lg">
              No Battles Found
            </h3>
            <p className="text-gray-400 max-w-xl mx-auto text-lg mb-12 leading-relaxed font-medium">
              We couldn't find any battles matching your search. Try different filters or create your own battle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('active');
                  setSortBy('newest');
                }}
                className="btn-outline hover:border-[#c77dff] hover:text-[#c77dff] px-6 py-3 sm:px-8 sm:py-3.5
                border-2 border-border-light rounded-xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300
                hover:shadow-[0_0_20px_rgba(199,125,255,0.15)] hover:bg-[#c77dff]/5 text-sm sm:text-base"
              >
                <span className="material-symbols-outlined text-xl sm:text-[1.4rem]">refresh</span>
                Reset Filters
              </button>
              <button onClick={() => setShowCreateForm(true)} className="hover:shadow-[0_0_30px_rgba(199,125,255,0.3)] hover:text-white text-[#c77dff] px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base bg-surface border-2 border-[#7b2cbf]/50 hover:border-[#c77dff] hover:bg-gradient-to-r hover:from-[#7b2cbf] hover:to-[#5a189a] transition-all hover:-translate-y-1 duration-300">
                <span className="material-symbols-outlined text-xl sm:text-[1.4rem]">add_circle</span>
                Deploy Now
              </button>
            </div>
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
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/25 text-green-300 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

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
              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium"
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
              className="resize-none w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium"
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
              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium"
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
              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium"
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
                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all font-medium text-gray-300"
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
                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all font-medium text-gray-300"
              />
            </div>
          </div>

          <button type="submit" disabled={creatingBattle} className="group relative w-full overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:-translate-y-1">
            <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
            <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide">
              {creatingBattle ? 'CREATING...' : 'CREATE BATTLE'}
            </span>
          </button>
        </form>
      </Modal>

    </div>
  );
}
