'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShareIcon } from '@heroicons/react/24/outline';

export default function ScorecardPage({ params }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scorecardData, setScorecardData] = useState(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const { battleId, userId } = params;

  useEffect(() => {
    if (battleId && userId) {
      fetchScorecardData();
    }
  }, [battleId, userId]);

  const fetchScorecardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scorecard/${battleId}/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch scorecard data');
      }

      const data = await response.json();
      setScorecardData(data);
      setLoading(false);
    } catch (err) {
      console.error('Scorecard fetch error:', err);
      setError(err.message || 'Failed to load scorecard data');
      setLoading(false);
    }
  };

  const handleShareTwitter = () => {
    if (!scorecardData) return;

    const scorecardUrl = `${window.location.origin}/scorecard/${battleId}/${userId}`;
    const tweetText =
      scorecardData.stats.rank > 0
        ? `Just finished the ${scorecardData.battle.name} battle! 🎵\nRanked #${scorecardData.stats.rank} with ${scorecardData.stats.score} scrobbles 🏆\n\nCheck it out:\n${scorecardUrl}\n\n#BTS #ARMYBattles #StreamBattles\nCreator: @Boy_With_Code`
        : `Just finished the ${scorecardData.battle.name} battle! 🎵\n\nCheck it out:\n${scorecardUrl}\n\n#BTS #ARMYBattles #StreamBattles\nCreator: @Boy_With_Code`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = () => {
    const scorecardUrl = `${window.location.origin}/scorecard/${battleId}/${userId}`;
    navigator.clipboard.writeText(scorecardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface via-purple-950 to-surface">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-white"></div>
          <p className="mt-4 text-white">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface via-purple-950 to-surface p-4">
        <div className="w-full max-w-md rounded-lg bg-red-500/20 p-6">
          <p className="mb-2 text-center font-semibold text-red-200">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={fetchScorecardData}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!scorecardData) return null;

  const { battle, user, stats, team, leaderboard } = scorecardData;

  // Desktop layout (matches the image layout you provided)
  return (
    <div className="min-h-screen bg-[#0a0118]">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-purple-600/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-pink-600/10 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl p-4 md:p-8">
        {/* Header with Share Buttons */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              ARMYBATTLES
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">Battle Scorecard</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShareTwitter}
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl hover:scale-105"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share
            </button>
            <button
              onClick={handleCopyLink}
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-300 backdrop-blur-sm transition-all hover:border-purple-500/50 hover:bg-purple-500/20 hover:scale-105"
            >
              <ShareIcon className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Main Content - Desktop Layout (as per your design) */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-[320px_1fr] md:grid-rows-[auto_1fr]">
          {/* Top Left: Site Logo */}
          <div className="flex h-40 w-full items-center justify-center overflow-hidden md:h-64 md:row-span-1">
            <div className="relative h-full w-full">
              <img
                src="https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png"
                alt="ARMYBATTLES"
                className="absolute inset-0 m-auto h-full w-full object-contain drop-shadow-2xl"
                style={{ transform: 'scale(1.8)' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white drop-shadow-lg">AB</div>';
                }}
              />
            </div>
          </div>

          {/* Top Right: Battle Name and Rankings Header */}
          <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-purple-900/30 to-pink-950/40 p-4 backdrop-blur-sm md:p-6 md:row-span-1 flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 transition-opacity group-hover:opacity-100" />
            <h2 className="relative text-center text-2xl font-black tracking-tight text-white md:text-4xl">
              {battle.name}
            </h2>
            <h3 className="relative mt-2 text-center text-lg font-bold uppercase tracking-wider text-purple-300/80 md:text-2xl">
              Battle Rankings
            </h3>
          </div>

          {/* Bottom Left: User Profile Card */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 via-purple-900/50 to-purple-950/60 p-4 backdrop-blur-sm md:p-6">
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative flex flex-col items-center">
              {user.avatarUrl ? (
                <div className="mb-3 md:mb-4 relative">
                  <div className="absolute inset-0 rounded-full bg-purple-500 blur-xl opacity-40" />
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    className="relative h-24 w-24 rounded-full border-2 border-purple-500/50 md:h-32 md:w-32"
                  />
                </div>
              ) : (
                <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-purple-500/50 bg-purple-600 text-4xl font-black text-white shadow-lg shadow-purple-500/50 md:mb-4 md:h-32 md:w-32 md:text-5xl">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </div>
              )}

              <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">
                {user.displayName || user.username}
              </h3>

              <div className="mb-3 text-center md:mb-4">
                <div className="text-4xl font-black text-purple-400 md:text-5xl">{stats.score}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-400/70 md:text-sm">scrobbles</div>
              </div>

              <div className="w-full rounded-xl border border-purple-500/20 bg-purple-950/50 p-2 text-center backdrop-blur-sm md:p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-400/60 md:text-sm">Ranked</div>
                <div className="text-xl font-black text-white md:text-2xl">
                  #{stats.rank} <span className="text-purple-400/60">/ {team?.totalPlayers || battle.participantCount}</span>
                </div>
              </div>

              {team && (
                <div className="mt-3 w-full rounded-xl border border-pink-500/30 bg-pink-950/40 p-3 backdrop-blur-sm md:mt-4 md:p-4">
                  <div className="mb-2 flex items-center justify-center gap-2 text-center text-base font-bold text-white md:text-lg">
                    <svg className="h-4 w-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    {team.name}
                  </div>
                  <div className="flex justify-between text-xs font-medium text-pink-200/80 md:text-sm">
                    <span>Team Rank:</span>
                    <span className="font-bold text-white">#{team.teamRank || team.rank}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-pink-200/80 md:text-sm">
                    <span>Contribution:</span>
                    <span className="font-bold text-white">{team.contribution}</span>
                  </div>
                </div>
              )}

              {!team && (
                <div className="mt-3 w-full rounded-xl border border-purple-500/30 bg-purple-950/40 p-2 text-center backdrop-blur-sm md:mt-4 md:p-3">
                  <span className="text-base font-bold text-purple-200 md:text-lg">🏆 Solo Player</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Right: Leaderboard and Stats */}
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Leaderboard */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-purple-900/30 to-pink-950/40 p-4 backdrop-blur-sm md:p-6">
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />

              <h3 className="relative mb-3 flex items-center gap-2 text-lg font-black uppercase tracking-wider text-white md:mb-4 md:text-xl">
                <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Top 5 Rankings
              </h3>

              <div className="relative space-y-2">
                {leaderboard && leaderboard.length > 0 ? (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.02] ${
                        entry.rank === 1
                          ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 shadow-lg shadow-yellow-500/10'
                          : entry.rank === 2
                          ? 'border-gray-400/50 bg-gradient-to-r from-gray-500/20 to-gray-400/10 shadow-lg shadow-gray-500/10'
                          : entry.rank === 3
                          ? 'border-orange-500/50 bg-gradient-to-r from-orange-600/20 to-orange-500/10 shadow-lg shadow-orange-500/10'
                          : 'border-purple-500/20 bg-purple-950/30 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base font-black ${
                          entry.rank === 1
                            ? 'bg-yellow-500 text-yellow-50 shadow-lg shadow-yellow-500/50'
                            : entry.rank === 2
                            ? 'bg-gray-400 text-gray-50 shadow-lg shadow-gray-500/50'
                            : entry.rank === 3
                            ? 'bg-orange-500 text-orange-50 shadow-lg shadow-orange-500/50'
                            : 'bg-purple-900/50 text-purple-300'
                        }`}>
                          {getRankEmoji(entry.rank)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-bold text-white">{entry.name}</div>
                          {entry.type === 'team' && entry.memberCount && (
                            <div className="text-xs font-medium text-purple-400/70">{entry.memberCount} members</div>
                          )}
                        </div>
                        <div className="text-lg font-black text-white">
                          {(entry.score || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-purple-400/50">No rankings available</div>
                )}
              </div>
            </div>

            {/* Battle Stats */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-pink-950/40 via-purple-950/40 to-pink-950/40 p-4 backdrop-blur-sm md:p-6">
              <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-pink-500/10 blur-2xl" />

              <div className="relative grid grid-cols-3 gap-2 text-center md:gap-4">
                <div className="group rounded-xl border border-purple-500/20 bg-purple-950/40 p-2 transition-all hover:border-purple-500/40 hover:bg-purple-950/60 md:p-4">
                  <svg className="mx-auto mb-1 h-4 w-4 text-purple-400 md:mb-2 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <div className="text-xl font-black text-purple-400 md:text-3xl">{battle.participantCount}</div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-400/60 md:mt-1 md:text-xs">Participants</div>
                </div>
                <div className="group rounded-xl border border-pink-500/20 bg-pink-950/40 p-2 transition-all hover:border-pink-500/40 hover:bg-pink-950/60 md:p-4">
                  <svg className="mx-auto mb-1 h-4 w-4 text-pink-400 md:mb-2 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xl font-black text-pink-400 md:text-3xl">
                    {stats.totalScrobbles.toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-pink-400/60 md:mt-1 md:text-xs">Scrobbles</div>
                </div>
                <div className="group rounded-xl border border-purple-500/20 bg-purple-950/40 p-2 transition-all hover:border-purple-500/40 hover:bg-purple-950/60 md:p-4">
                  <svg className="mx-auto mb-1 h-4 w-4 text-purple-400 md:mb-2 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xl font-black text-purple-400 md:text-3xl">{battle.duration}</div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-400/60 md:mt-1 md:text-xs">Duration</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-purple-500/10 pt-6 text-center md:mt-10 md:pt-8">
          <a
            href="https://armybattles.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base font-bold text-purple-400 transition-colors hover:text-purple-300 md:text-lg"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            armybattles.netlify.app
          </a>
          <p className="mt-2 text-xs font-medium text-purple-400/50 md:text-sm">Real-time BTS Streaming Battles</p>
          <p className="mt-2 text-[10px] font-medium text-purple-400/30 md:text-xs">
            Created by{' '}
            <a
              href="https://twitter.com/boy_with_code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400/60 transition-colors hover:text-purple-400"
            >
              @boy_with_code
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
