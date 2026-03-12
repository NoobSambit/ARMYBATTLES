import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import Badge from './Badge';

export default function BattleCard({ battle }) {
  return (
    <Link href={`/battle/${battle.id}`} className="group block h-full outline-none">
      <div className="relative flex flex-col h-full p-4 sm:p-6 lg:p-7 rounded-3xl bg-[#090b14] border border-[#7b2cbf]/20 shadow-lg group-hover:border-[#9d4edd]/50 group-hover:shadow-[0_0_30px_rgba(157,78,221,0.15)] transition-all duration-500 overflow-hidden transform group-hover:-translate-y-2">

        {/* Subtle background glow effect on hover */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#7b2cbf]/10 rounded-full blur-[80px] group-hover:bg-[#9d4edd]/20 transition-colors duration-700 pointer-events-none" />

        <div className="relative z-10 flex justify-between items-start mb-6 gap-3">
          <h3 className="text-xl lg:text-3xl font-black text-white leading-[1.1] transition-all duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-[#e0aaff] group-hover:to-[#9d4edd] line-clamp-2 md:line-clamp-3 break-words hyphens-auto pr-2">
            {battle.name}
          </h3>
          <div className="flex-shrink-0 mt-1">
            <Badge status={battle.status} />
          </div>
        </div>

        <div className="relative z-10 flex-grow flex flex-col gap-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col bg-white/[0.02] rounded-xl p-3 border border-white/[0.02] group-hover:border-[#9d4edd]/20 transition-colors duration-500">
              <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-[#c77dff] mb-1 transition-colors duration-500">
                <span className="material-symbols-outlined text-[1rem]">group</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Players</span>
              </div>
              <span className="text-gray-100 font-black text-lg sm:text-2xl pl-1 sm:pl-6 transition-colors duration-500 truncate">{battle.participantCount || 0}</span>
            </div>

            {battle.trackCount !== undefined && (
              <div className="flex flex-col bg-white/[0.02] rounded-xl p-3 border border-white/[0.02] group-hover:border-[#7b2cbf]/20 transition-colors duration-500">
                <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-[#e0aaff] mb-1 transition-colors duration-500">
                  <span className="material-symbols-outlined text-[1rem]">music_note</span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Tracks</span>
                </div>
                <span className="text-gray-100 font-black text-lg sm:text-2xl pl-1 sm:pl-6 transition-colors duration-500 truncate">{battle.trackCount}</span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between py-2.5 border-b border-white/5 group-hover:border-[#7b2cbf]/30 transition-colors duration-500">
              <div className="flex items-center gap-2 text-gray-500 group-hover:text-[#c77dff] transition-colors duration-500 shrink-0">
                <span className="material-symbols-outlined text-[1.1rem]">schedule</span>
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Start</span>
              </div>
              <span className="text-gray-300 text-xs sm:text-sm font-semibold transition-colors duration-500 text-right truncate pl-2">{formatDate(battle.startTime)}</span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-transparent group-hover:border-[#7b2cbf]/30 transition-colors duration-500">
              <div className="flex items-center gap-2 text-gray-500 group-hover:text-[#c77dff] transition-colors duration-500 shrink-0">
                <span className="material-symbols-outlined text-[1.1rem]">flag</span>
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">End</span>
              </div>
              <span className="text-gray-300 text-xs sm:text-sm font-semibold transition-colors duration-500 text-right truncate pl-2">{formatDate(battle.endTime)}</span>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="relative z-10 mt-5 pt-4">
          <div className="w-full flex items-center justify-center gap-2 bg-white/5 group-hover:bg-gradient-to-r group-hover:from-[#7b2cbf]/30 group-hover:to-[#5a189a]/30 text-gray-400 group-hover:text-white border border-transparent group-hover:border-[#9d4edd]/40 py-3.5 rounded-xl font-black text-sm transition-all duration-500">
            <span className="tracking-widest uppercase">Inspect</span>
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1.5 transition-transform duration-300 group-hover:text-[#e0aaff]">arrow_forward</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
