import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import Badge from './Badge';

export default function BattleCard({ battle }) {
  return (
    <Link href={`/battle/${battle.id}`}>
      <div className="card-premium p-4 sm:p-6 lg:p-7 hover:scale-[1.02] hover:-translate-y-2 transition-all duration-400 group cursor-pointer relative overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-bts-purple/5 via-transparent to-bts-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

        {/* Header with title and badge */}
        <div className="relative flex items-start justify-between mb-3 sm:mb-6 gap-2">
          <h3 className="text-sm sm:text-lg lg:text-2xl font-black text-gray-100 line-clamp-2 group-hover:gradient-text-army transition-all duration-300">
            {battle.name}
          </h3>
          <Badge status={battle.status} />
        </div>

        {/* Battle stats with premium icons */}
        <div className="relative space-y-2.5 sm:space-y-4 mb-5 sm:mb-7">
          <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300 gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-bts-purple/20 to-bts-purple/10 border-2 border-bts-purple/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-bts-purple/50 transition-all duration-300 group-hover:glow-purple">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-bts-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-white text-sm sm:text-lg">{battle.participantCount || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-semibold">Participants</p>
            </div>
          </div>

          <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300 gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-bts-pink/20 to-bts-pink/10 border-2 border-bts-pink/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-bts-pink/50 transition-all duration-300 group-hover:glow-pink">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-bts-pink-bright" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-white text-xs sm:text-base">{formatDate(battle.startTime)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-semibold">Start Time</p>
            </div>
          </div>

          <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300 gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-bts-pink/20 to-bts-pink/10 border-2 border-bts-pink/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-bts-pink/50 transition-all duration-300 group-hover:glow-pink">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-bts-pink-bright" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-white text-xs sm:text-base">{formatDate(battle.endTime)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-semibold">End Time</p>
            </div>
          </div>

          {battle.trackCount && (
            <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300 gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-army-gold/20 to-army-gold/10 border-2 border-army-gold/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-army-gold/50 transition-all duration-300 group-hover:glow-gold">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-army-gold-bright" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <p className="font-black text-white text-sm sm:text-lg">{battle.trackCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-semibold">Tracks</p>
              </div>
            </div>
          )}
        </div>

        {/* Premium CTA button */}
        <div className="relative pt-4 sm:pt-5 border-t-2 border-border-light/50 group-hover:border-bts-purple/40 transition-colors duration-300">
          <button className="w-full btn-primary text-center text-xs sm:text-sm lg:text-base py-2.5 sm:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="relative z-10 font-black">View Battle</span>
            <svg className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
