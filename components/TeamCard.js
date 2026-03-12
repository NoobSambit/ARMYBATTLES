'use client';

import { cn } from '@/lib/utils';

export default function TeamCard({ team, rank, onClick }) {
  const isTopRanked = rank && rank <= 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden bg-[#090b14] border border-white/5 rounded-2xl p-4 md:p-6 cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_rgba(123,44,191,0.2)] hover:-translate-y-1',
        team.isCheater ? 'hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'hover:border-[#7b2cbf]/50'
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        'absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none transition-all duration-500',
        team.isCheater ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-[#7b2cbf]/10 group-hover:bg-[#c77dff]/20'
      )} />

      {/* Side accent line */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 group-hover:w-1.5',
        team.isCheater ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-gradient-to-b from-[#c77dff] to-[#5a189a] shadow-[0_0_10px_rgba(157,78,221,0.5)]'
      )} />

      <div className="relative z-10 flex items-center justify-between gap-4 md:gap-6 pl-2 md:pl-4">
        {/* Rank & Team Info */}
        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
          {/* Rank Badge */}
          {rank && (
            <div className={cn(
              'w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl flex-shrink-0 shadow-lg border',
              isTopRanked
                ? rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                  : rank === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-900 border-gray-300 shadow-[0_0_20px_rgba(156,163,175,0.4)]'
                    : 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.4)]'
                : 'bg-white/5 border-white/10 text-gray-400 group-hover:text-white transition-colors group-hover:border-[#7b2cbf]/40'
            )}>
              {isTopRanked && rank === 1 && <span className="text-2xl drop-shadow-sm">👑</span>}
              {isTopRanked && rank === 2 && <span className="text-2xl drop-shadow-sm">🥈</span>}
              {isTopRanked && rank === 3 && <span className="text-2xl drop-shadow-sm">🥉</span>}
              {!isTopRanked && `#${rank}`}
            </div>
          )}

          {/* Team Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm md:text-lg font-black text-gray-100 truncate group-hover:text-white transition-colors tracking-wide">
                {team.teamName}
              </h3>
              {team.isCheater && (
                <span className="px-2 py-0.5 bg-red-950/50 border border-red-500/50 rounded-md text-[10px] font-black text-red-500 uppercase tracking-widest flex-shrink-0 animate-pulse">
                  Flagged
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-widest group-hover:text-[#c77dff] transition-colors">
              <span className="material-symbols-outlined text-[14px]">groups</span>
              {team.memberCount} {team.memberCount === 1 ? 'ARMY' : 'ARMYs'}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 group-hover:from-white group-hover:to-gray-200 transition-all tracking-tighter">
            {team.totalScore.toLocaleString()}
          </div>
          <div className="flex justify-end gap-1 mt-1 text-[10px] sm:text-[11px] text-gray-600 font-bold uppercase tracking-[0.2em] group-hover:text-[#e0aaff]/60 transition-colors">
            SCROBBLES <span className="material-symbols-outlined text-[12px] animate-pulse">equalizer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
