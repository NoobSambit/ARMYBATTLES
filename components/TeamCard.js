'use client';

import { cn } from '@/lib/utils';

export default function TeamCard({ team, rank, onClick }) {
  const isTopRanked = rank && rank <= 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-4 md:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-card-glow-lg',
        'border-l-4',
        team.isCheater
          ? 'border-l-red-500/70'
          : 'border-l-gradient-to-b from-bts-purple to-bts-pink'
      )}
    >
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Rank & Team Info */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          {/* Rank Badge */}
          {rank && (
            <div className={cn(
              'w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-sm md:text-lg flex-shrink-0',
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-100 truncate">
                {team.teamName}
              </h3>
              {team.isCheater && (
                <span className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 rounded text-[10px] font-semibold text-red-300 uppercase flex-shrink-0">
                  ⚠️ Flagged
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted">
              {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
            {team.totalScore}
          </div>
          <div className="text-[10px] sm:text-xs text-muted uppercase tracking-wider">
            Total Scrobbles
          </div>
        </div>
      </div>

      {/* Hover Indicator */}
      <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-border-light flex items-center justify-between text-[10px] sm:text-sm text-muted">
        <span className="hidden sm:inline">Click to view team details</span>
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1"
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
