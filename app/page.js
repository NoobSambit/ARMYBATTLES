'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getBattleStatus, formatDate } from '@/lib/utils';

export default function Home() {
  const [battles, setBattles] = useState([]);
  const [metrics, setMetrics] = useState({
    activeBattles: 0,
    totalPlayers: 0,
    activePlayers: 0,
    totalStreamsVerified: 0,
    totalBattlesHosted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const metricsRailRef = useRef(null);

  useEffect(() => {
    fetchBattles();
  }, []);

  useEffect(() => {
    const rail = metricsRailRef.current;
    if (!rail || typeof window === 'undefined') {
      return undefined;
    }

    let intervalId;
    let resumeTimeoutId;

    const cards = Array.from(rail.querySelectorAll('[data-metric-card="true"]'));
    if (!cards.length) {
      return undefined;
    }

    const updateActiveIndex = () => {
      if (window.innerWidth >= 1280) {
        setActiveMetricIndex(0);
        return;
      }

      const railCenter = rail.scrollLeft + (rail.clientWidth / 2);
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + (card.clientWidth / 2);
        const distance = Math.abs(cardCenter - railCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveMetricIndex(closestIndex);
    };

    const scrollToCard = (index) => {
      const targetCard = cards[index];
      if (!targetCard) {
        return;
      }

      rail.scrollTo({
        left: targetCard.offsetLeft - 16,
        behavior: 'smooth',
      });
    };

    const startAutoScroll = () => {
      if (window.innerWidth >= 1280) {
        return;
      }

      clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        setActiveMetricIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % cards.length;
          scrollToCard(nextIndex);
          return nextIndex;
        });
      }, 2800);
    };

    const pauseAndResume = () => {
      clearInterval(intervalId);
      clearTimeout(resumeTimeoutId);
      resumeTimeoutId = window.setTimeout(startAutoScroll, 4000);
    };

    updateActiveIndex();
    startAutoScroll();

    rail.addEventListener('scroll', updateActiveIndex, { passive: true });
    rail.addEventListener('touchstart', pauseAndResume, { passive: true });
    rail.addEventListener('pointerdown', pauseAndResume);
    window.addEventListener('resize', startAutoScroll);
    window.addEventListener('resize', updateActiveIndex);

    return () => {
      clearInterval(intervalId);
      clearTimeout(resumeTimeoutId);
      rail.removeEventListener('scroll', updateActiveIndex);
      rail.removeEventListener('touchstart', pauseAndResume);
      rail.removeEventListener('pointerdown', pauseAndResume);
      window.removeEventListener('resize', startAutoScroll);
      window.removeEventListener('resize', updateActiveIndex);
    };
  }, []);

  const metricCards = [
    {
      label: 'Active Battles',
      value: metrics.activeBattles,
      icon: <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>,
    },
    {
      label: 'Total Players',
      value: metrics.totalPlayers.toLocaleString(),
      icon: <span className="material-symbols-outlined text-[12px]">groups</span>,
    },
    {
      label: 'Active Players',
      value: metrics.activePlayers.toLocaleString(),
      icon: <span className="material-symbols-outlined text-[12px]">group</span>,
    },
    {
      label: 'Total Streams Verified',
      value: metrics.totalStreamsVerified.toLocaleString(),
      icon: <span className="material-symbols-outlined text-[12px]">verified</span>,
    },
    {
      label: 'Total Battles Hosted',
      value: metrics.totalBattlesHosted.toLocaleString(),
      icon: <span className="material-symbols-outlined text-[12px]">stadia_controller</span>,
    },
  ];

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
        setMetrics({
          activeBattles: data.metrics?.activeBattles ?? battlesWithStatus.filter(b => b.status === 'active').length,
          totalPlayers: data.metrics?.totalPlayers ?? battlesWithStatus.reduce((sum, battle) => sum + (battle.participantCount || 0), 0),
          activePlayers: data.metrics?.activePlayers ?? battlesWithStatus.filter(b => b.status === 'active').reduce((sum, battle) => sum + (battle.participantCount || 0), 0),
          totalStreamsVerified: data.metrics?.totalStreamsVerified ?? 0,
          totalBattlesHosted: data.metrics?.totalBattlesHosted ?? battlesWithStatus.length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch battles:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBattles = battles.filter(b => b.status === 'active');
  const upcomingBattles = battles.filter(b => b.status === 'upcoming');
  const getBattleId = (battle) => battle.id || battle._id;

  return (
    <div className="relative min-h-screen flex flex-col bg-background-dark text-slate-100 antialiased overflow-x-hidden pt-20">
      {/* Background Hero Glow - separated so it doesn't get boxed in by fixed/max widths */}
      <div className="hero-glow absolute top-0 left-0 w-full h-screen pointer-events-none opacity-50 z-0"></div>

      {/* Hero Section */}
      <section className="relative pt-6 pb-12 px-4 sm:px-8 max-w-[1600px] mx-auto flex items-center justify-center w-full z-10 mt-4 md:mt-8">
        <div className="relative w-full max-w-none md:aspect-[21/9] min-h-[500px] md:min-h-[600px] px-6 py-10 sm:px-12 sm:py-12 md:px-14 md:py-14 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.2)] border border-white/10 flex flex-col items-center justify-center text-center group transition-all duration-700 hover:shadow-[0_0_80px_rgba(124,58,237,0.35)] hover:border-primary/50">

          {/* Background Layer: using our external graphic */}
          <div className="absolute inset-0 z-0 bg-background-dark">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-70 transition-all duration-1000 group-hover:opacity-90 group-hover:scale-[1.02] transform"
              style={{
                backgroundImage: "url('/armybattles_hero_banner.png'), url('/hero-bg.svg')",
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
              }}
            />

            {/* Dark overlay for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at center, rgba(11,5,18,0.08) 0%, rgba(11,5,18,0.18) 24%, rgba(11,5,18,0.52) 62%, rgba(11,5,18,0.86) 100%), linear-gradient(180deg, rgba(11,5,18,0.58) 0%, rgba(11,5,18,0.14) 34%, rgba(11,5,18,0.18) 58%, rgba(11,5,18,0.72) 100%)",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex min-h-[420px] md:min-h-[500px] w-full max-w-5xl flex-col items-center justify-between py-4 md:py-6">
            <div className="flex w-full flex-col items-center gap-5 pt-3 md:pt-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,58,237,0.28)] bg-[rgba(124,58,237,0.12)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-slate-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-accent-cyan shadow-[0_0_16px_rgba(34,211,238,0.9)]"></span>
                Live Battle Platform
              </span>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[7rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-[#c77dff] drop-shadow-2xl tracking-tighter leading-[0.95]">
                ARMYBATTLES
              </h1>
            </div>

            <div className="flex w-full max-w-3xl flex-col items-center gap-8 pb-5 md:pb-8">
              <p className="text-balance text-base font-medium leading-8 text-[#E5E7EB] drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] md:text-[1.4rem]">
                Transform your music listening into competitive battles. Connect your Last.fm account, stream designated tracks, and conquer the live global leaderboards.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="border border-[#f7d2a6]/20 bg-[linear-gradient(135deg,rgba(191,87,57,0.98)_0%,rgba(142,43,63,0.96)_52%,rgba(60,18,34,0.96)_100%)] text-white px-10 py-5 rounded-xl font-black text-lg sm:text-xl transition-all flex items-center gap-3 hover:-translate-y-1 hover:border-[#f7d2a6]/40 hover:shadow-[0_18px_50px_rgba(120,37,44,0.45)]"
                >
                  Enter Arena <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                </Link>
                <Link
                  href="/battles"
                  className="border border-[#8fc7c4]/20 bg-[linear-gradient(135deg,rgba(18,61,71,0.98)_0%,rgba(11,38,47,0.96)_50%,rgba(7,20,28,0.96)_100%)] text-[#edf7f6] px-10 py-5 rounded-xl font-bold text-lg sm:text-xl transition-all flex items-center gap-3 hover:-translate-y-1 hover:border-[#8fc7c4]/40 hover:shadow-[0_18px_50px_rgba(10,41,48,0.45)]"
                >
                  View Battles <span className="material-symbols-outlined text-2xl">explore</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Metrics Strip */}
      <div className="w-full py-4 sm:py-6 mb-16 relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
          <div
            ref={metricsRailRef}
            className="overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex min-w-max gap-3 sm:gap-4 xl:grid xl:min-w-0 xl:grid-cols-5">
              {metricCards.map((card, index) => (
                <div
                  key={card.label}
                  data-metric-card="true"
                  className="min-w-[calc(100vw-2.75rem)] snap-center rounded-2xl border border-[rgba(109,64,170,0.52)] bg-[linear-gradient(180deg,rgba(40,18,58,0.96)_0%,rgba(17,10,28,0.98)_100%)] px-5 py-4 shadow-[inset_0_1px_0_rgba(124,58,237,0.14)] sm:min-w-[280px] xl:min-w-0"
                >
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">{card.icon} {card.label}</span>
                  <span className="mt-3 block text-white text-3xl sm:text-4xl font-display font-black">{card.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 xl:hidden">
            {metricCards.map((card, index) => (
              <button
                key={card.label}
                type="button"
                aria-label={`Show ${card.label}`}
                onClick={() => {
                  setActiveMetricIndex(index);
                  const rail = metricsRailRef.current;
                  const targetCard = rail?.querySelectorAll('[data-metric-card="true"]')?.[index];
                  if (rail && targetCard) {
                    rail.scrollTo({ left: targetCard.offsetLeft - 16, behavior: 'smooth' });
                  }
                }}
                className={index === activeMetricIndex
                  ? 'h-2.5 w-6 rounded-full bg-[#f1d0a9] shadow-[0_0_18px_rgba(241,208,169,0.35)] transition-all'
                  : 'h-2.5 w-2.5 rounded-full bg-primary/30 transition-all'}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-8 space-y-32">
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
              Loading
            </h3>
            <p className="text-bts-blue-light uppercase tracking-[0.3em] text-sm font-bold flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-bts-blue animate-ping"></span>
              Generating Arena...
            </p>
          </div>
        ) : (
          <>
            {/* Active Battles Radar */}
            {activeBattles.length > 0 && (
              <section className="mb-24">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                  <div className="space-y-2">
                    <h2 className="font-display text-4xl font-black text-white flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-green"></span>
                      </span>
                      Live Arena Servers
                    </h2>
                    <p className="text-[#D1D5DB]">Ongoing matches. Enter a server to compete and spectate.</p>
                  </div>
                  <Link href="/battles" className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 flex items-center gap-2 text-sm font-bold">
                    View Server Browser <span className="material-symbols-outlined text-[16px]">explore</span>
                  </Link>
                </div>

                <div className="flex flex-col gap-4">
                  {activeBattles.map(battle => {
                    const battleId = getBattleId(battle);
                    const battleHref = battleId ? `/battle/${battleId}` : '/battles';

                    return (
                    <div key={battleId || battle.name} className="relative group overflow-hidden bg-card-glass border border-white/5 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-accent-green/30 transition-all shadow-xl">
                      {/* Subtle hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10 w-full">
                        {/* Status indicator */}
                        <div className="flex-shrink-0 hidden sm:block">
                          <div className="w-16 h-16 rounded-xl bg-background-dark border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-accent-green/40 transition-colors">
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-green shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                            <span className="material-symbols-outlined text-white/50 group-hover:text-accent-green transition-colors text-3xl">graphic_eq</span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-2 w-full">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded text-accent-green bg-accent-green/10 border border-accent-green/20">LIVE</span>
                            <h3 className="font-display text-xl font-bold text-white group-hover:text-accent-green transition-colors line-clamp-1">{battle.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">groups</span> {battle.participants?.length || 0} Players connected</span>
                            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">library_music</span> {battle.trackCount || 0} Target Tracks</span>
                            <span className="hidden lg:inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-accent-green">play_circle</span> {battle.startTime ? formatDate(battle.startTime) : 'TBD'}</span>
                            <span className="hidden xl:inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-red-400">stop_circle</span> {battle.endTime ? formatDate(battle.endTime) : 'TBD'}</span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex-shrink-0 mt-4 md:mt-0 w-full md:w-auto flex">
                          <Link href={battleHref} className="w-full md:w-auto px-8 py-3 rounded-xl bg-white/5 hover:bg-accent-green text-white font-bold transition-all text-center flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:text-background-dark">
                            View Battle <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Upcoming Battles Terminal */}
            {upcomingBattles.length > 0 && (
              <section className="mb-20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                  <div className="space-y-2">
                    <h2 className="font-display text-4xl font-black text-white flex items-center gap-3">
                      <span className="material-symbols-outlined text-accent-cyan text-4xl">calendar_clock</span>
                      Deployment Schedule
                    </h2>
                    <p className="text-[#D1D5DB]">Upcoming battles preparing for launch.</p>
                  </div>
                  <Link href="/battles" className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 flex items-center gap-2 text-sm font-bold">
                    View Full Roster <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingBattles.map(battle => {
                    const battleId = getBattleId(battle);
                    const battleHref = battleId ? `/battle/${battleId}` : '/battles';

                    return (
                    <div key={battleId || battle.name} className="relative group bg-background-dark border border-white/10 rounded-2xl p-6 hover:border-accent-cyan/50 transition-colors flex flex-col h-full overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-accent-cyan/20 transition-all"></div>

                      <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-start relative z-10">
                        <div className="space-y-1">
                          <span className="text-[10px] text-accent-cyan font-bold tracking-widest uppercase flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">schedule</span> INCOMING</span>
                          <h3 className="font-display text-xl font-bold text-white leading-tight">{battle.name}</h3>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 relative z-10 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">calendar_today</span> Start Time</span>
                            <span className="text-white font-mono text-sm">{battle.startTime ? formatDate(battle.startTime) : 'TBD'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">event_available</span> End Time</span>
                            <span className="text-white font-mono text-sm">{battle.endTime ? formatDate(battle.endTime) : 'TBD'}</span>
                          </div>
                        </div>

                        {battle.trackCount && (
                          <div className="flex items-center gap-2 text-sm text-slate-400 mt-2 border-t border-white/10 pt-4">
                            <span className="material-symbols-outlined text-[16px] text-accent-magenta">library_music</span>
                            <span>{battle.trackCount} Tracks loaded</span>
                          </div>
                        )}
                      </div>

                      <div className="relative z-10 mt-auto">
                        <Link href={battleHref} className="w-full py-3 rounded-lg border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan hover:text-background-dark transition-all text-center flex items-center justify-center gap-2 font-bold text-sm">
                          <span className="material-symbols-outlined text-[18px]">notifications</span> Alert Me
                        </Link>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Fallback if no battles overall */}
            {activeBattles.length === 0 && upcomingBattles.length === 0 && (
              <div className="card text-center p-12 sm:p-16 mb-20 bg-panel/30 border-dashed">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-panel-hover flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl sm:text-5xl text-bts-purple">sensors_off</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-200 mb-3">No Active Battles</h3>
                <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto mb-8">
                  There are no live or upcoming battles at the moment. You can host your own battle from the dashboard.
                </p>
                <Link href="/dashboard" className="btn-primary inline-flex">
                  Host a Battle
                </Link>
              </div>
            )}
          </>
        )}

        {/* Elite Protocol */}
        <section className="glass-card rounded-[3rem] p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-magenta/20 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="font-display text-3xl md:text-5xl font-black text-white uppercase">Elite Scrobbling Protocol</h2>
              <p className="text-[#D1D5DB]">Master the platform in three simple steps. Your music is your weapon.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-6 group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent-magenta p-[1px] group-hover:scale-110 transition-transform">
                  <div className="w-full h-full bg-background-dark rounded-3xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-accent-magenta">link</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-2xl font-black text-white">01. Sync Pulse</h4>
                  <p className="text-[#D1D5DB] text-sm">Connect your Last.fm account to establish your digital frequency and generate unique stats.</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-6 group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-magenta to-accent-cyan p-[1px] group-hover:scale-110 transition-transform">
                  <div className="w-full h-full bg-background-dark rounded-3xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-accent-cyan">grid_view</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-2xl font-black text-white">02. Select Mode</h4>
                  <p className="text-[#D1D5DB] text-sm">Choose between Solo battles or Team battles depending on your preference.</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-6 group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-cyan to-primary p-[1px] group-hover:scale-110 transition-transform">
                  <div className="w-full h-full bg-background-dark rounded-3xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-primary">trophy</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-2xl font-black text-white">03. Dominance</h4>
                  <p className="text-[#D1D5DB] text-sm">Compete in real-time, stream your gameplay, and climb the global scrobble-based leaderboard.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Combat Modes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pb-20 mt-32">
          <div className="order-2 lg:order-1 space-y-8 lg:pr-6">
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-accent-cyan">Choose Your Lane</p>
              <h2 className="font-display text-4xl font-black text-white">Combat Modes</h2>
              <p className="max-w-xl text-[#D1D5DB] text-lg leading-relaxed">
                Tailored experiences for every type of player. Whether you're a lone wolf or a tactical team, ARMYBATTLES adapts to your playstyle.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-primary">
                <span className="material-symbols-outlined text-[14px]">person</span>
                Solo Runs
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/8 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-accent-cyan">
                <span className="material-symbols-outlined text-[14px]">groups</span>
                Squad Play
              </span>
            </div>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white">person</span>
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold text-white">Solo Protocol</h4>
                  <p className="text-[#D1D5DB] text-sm mt-1 leading-relaxed">Join as an independent streamer and compete against the global leaderboard. Every verified scrobble pushes you higher up the ranks.</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/20 flex gap-6">
                <div className="w-12 h-12 rounded-full bg-accent-cyan flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-background-dark">groups</span>
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold text-white">Team Battles</h4>
                  <p className="text-[#D1D5DB] text-sm mt-1 leading-relaxed">Form a crew of unlimited size using private invite codes. Your team's position on the live leaderboard is the combined power of all members' valid scrobbles.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative rounded-[2.5rem] border border-[rgba(109,64,170,0.42)] bg-[linear-gradient(180deg,rgba(34,15,48,0.94)_0%,rgba(13,8,22,0.98)_100%)] p-4 sm:p-6 shadow-[0_0_50px_rgba(124,58,237,0.12)] overflow-hidden">
            <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-accent-magenta/12 blur-[90px] pointer-events-none"></div>
            <div className="absolute -bottom-20 left-0 h-40 w-40 rounded-full bg-accent-cyan/10 blur-[90px] pointer-events-none"></div>

            <div className="relative z-10 rounded-[2rem] border border-[rgba(109,64,170,0.34)] bg-[linear-gradient(180deg,rgba(19,10,32,0.76)_0%,rgba(10,8,20,0.84)_100%)] p-4 sm:p-5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-4 border-b border-[rgba(109,64,170,0.24)] pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-accent-cyan">Mode Control</p>
                  <h3 className="mt-2 font-display text-2xl font-black text-white">Battle Format Preview</h3>
                </div>
                <div className="rounded-full border border-[rgba(109,64,170,0.3)] bg-[rgba(124,58,237,0.1)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
                  Live UI
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[rgba(124,58,237,0.34)] bg-[rgba(124,58,237,0.12)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-white">person</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Solo</span>
                  </div>
                  <p className="mt-6 text-white font-display text-xl font-black">1vAll Push</p>
                  <p className="mt-1 text-sm text-slate-300">Personal climb through verified scrobbles.</p>
                </div>
                <div className="rounded-2xl border border-[rgba(0,240,255,0.28)] bg-[rgba(0,240,255,0.1)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-accent-cyan">groups</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-cyan">Teams</span>
                  </div>
                  <p className="mt-6 text-white font-display text-xl font-black">Crew Sync</p>
                  <p className="mt-1 text-sm text-slate-300">Shared scoreboards and invite-only squads.</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.75rem] border border-[rgba(109,64,170,0.3)] bg-[linear-gradient(180deg,rgba(124,58,237,0.08)_0%,rgba(6,182,212,0.04)_100%)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Current Match Flow</p>
                    <h4 className="mt-2 font-display text-xl font-black text-white">Combat Modes in Action</h4>
                  </div>
                  <div className="rounded-full border border-[#f1d0a9]/20 bg-[#f1d0a9]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#f1d0a9]">
                    Hybrid Lobby
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-[rgba(109,64,170,0.32)] bg-[linear-gradient(180deg,rgba(20,12,34,0.88)_0%,rgba(10,8,20,0.9)_100%)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                          <span className="material-symbols-outlined">person_play</span>
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-white">Solo Queue</p>
                          <p className="text-xs text-slate-400">Ranked by individual verified streams</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white">#12</p>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Live Rank</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-primary/12">
                      <div className="h-full w-[58%] rounded-full bg-[linear-gradient(90deg,#7c3aed_0%,#a78bfa_100%)]"></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[rgba(0,170,196,0.3)] bg-[linear-gradient(180deg,rgba(11,22,36,0.86)_0%,rgba(10,8,20,0.9)_100%)] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-cyan/15 text-accent-cyan">
                          <span className="material-symbols-outlined">shield</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black uppercase tracking-wide text-white">Team Queue</p>
                          <p className="max-w-[18rem] text-xs leading-5 text-slate-400">Combined squad score from active members in the current team lobby.</p>
                        </div>
                      </div>
                      <div className="pl-14 sm:pl-0 text-left sm:text-right">
                        <p className="text-lg font-black text-white">4 / 6</p>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Squads Live</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <div className="rounded-xl bg-primary/10 px-3 py-2 text-center text-xs font-bold text-slate-200">ALPHA</div>
                      <div className="rounded-xl bg-accent-cyan/10 px-3 py-2 text-center text-xs font-bold text-accent-cyan">SYNC</div>
                      <div className="rounded-xl bg-primary/10 px-3 py-2 text-center text-xs font-bold text-slate-200">RISE</div>
                      <div className="rounded-xl bg-primary/10 px-3 py-2 text-center text-xs font-bold text-slate-200">BORA</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[rgba(109,64,170,0.3)] bg-[linear-gradient(180deg,rgba(20,12,34,0.88)_0%,rgba(10,8,20,0.9)_100%)] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Solo Entries</p>
                    <p className="mt-2 text-2xl font-display font-black text-white">128</p>
                  </div>
                  <div className="rounded-2xl border border-[rgba(109,64,170,0.3)] bg-[linear-gradient(180deg,rgba(20,12,34,0.88)_0%,rgba(10,8,20,0.9)_100%)] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Team Lobbies</p>
                    <p className="mt-2 text-2xl font-display font-black text-white">24</p>
                  </div>
                  <div className="rounded-2xl border border-[rgba(109,64,170,0.3)] bg-[linear-gradient(180deg,rgba(20,12,34,0.88)_0%,rgba(10,8,20,0.9)_100%)] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Sync Window</p>
                    <p className="mt-2 text-2xl font-display font-black text-white">15m</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
