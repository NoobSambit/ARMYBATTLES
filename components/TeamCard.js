'use client';

import { cn } from '@/lib/utils';

export default function TeamCard({ team, rank, onClick }) {
  const isTopRanked = rank && rank <= 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-card-glow-lg',
        'border-l-4',
        team.isCheater
          ? 'border-l-red-500/70'
          : 'border-l-gradient-to-b from-bts-purple to-bts-pink'
      )}
    >
      <div className="flex items-center justify-between">
        {/* Rank & Team Info */}
        <div className="flex items-center gap-4 flex-1">
          {/* Rank Badge */}
          {rank && (
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg',
              isTopRanked
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900 shadow-glow-purple'
                : 'bg-surface-light text-gray-400'
            )}>
              {isTopRanked && rank === 1 && '👑'}
              {isTopRanked && rank === 2 && '🥈'}
              {isTopRanked && rank === 3 && '🥉'}
              {!isTopRanked && `#${rank}`}
            </div>
          )}

          {/* Team Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-gradient">
                {team.teamName}
              </h3>
              {team.isCheater && (
                <span className="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded-lg text-xs font-semibold text-red-300 uppercase">
                  ⚠️ Flagged
                </span>
              )}
            </div>
            <p className="text-sm text-muted">
              {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-3xl font-extrabold text-white">
            {team.totalScore}
          </div>
          <div className="text-xs text-muted uppercase tracking-wider">
            Total Scrobbles
          </div>
        </div>
      </div>

      {/* Hover Indicator */}
      <div className="mt-4 pt-4 border-t border-border-light flex items-center justify-between text-sm text-muted">
        <span>Click to view team details</span>
        <svg
          className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
