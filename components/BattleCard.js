import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import Badge from './Badge';

export default function BattleCard({ battle }) {
  return (
    <Link href={`/battle/${battle.id}`}>
      <div className="card p-6 hover:scale-105 hover:-translate-y-1 transition-all duration-400 group cursor-pointer">
        {/* Header with title and badge */}
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-100 line-clamp-2 group-hover:text-gradient transition-all duration-300">
            {battle.name}
          </h3>
          <Badge status={battle.status} />
        </div>

        {/* Battle stats with enhanced icons */}
        <div className="space-y-3 text-sm mb-6">
          <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            <div className="w-9 h-9 rounded-lg bg-bts-purple/10 border border-bts-purple/20 flex items-center justify-center mr-3 group-hover:bg-bts-purple/20 group-hover:border-bts-purple/40 transition-all duration-300">
              <svg className="w-5 h-5 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-200">{battle.participantCount || 0}</p>
              <p className="text-xs text-gray-500">Participants</p>
            </div>
          </div>

          <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            <div className="w-9 h-9 rounded-lg bg-bts-pink/10 border border-bts-pink/20 flex items-center justify-center mr-3 group-hover:bg-bts-pink/20 group-hover:border-bts-pink/40 transition-all duration-300">
              <svg className="w-5 h-5 text-bts-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-200">{formatDate(battle.startTime)}</p>
              <p className="text-xs text-gray-500">Start Time</p>
            </div>
          </div>

          {battle.trackCount && (
            <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mr-3 group-hover:bg-accent/20 group-hover:border-accent/40 transition-all duration-300">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-200">{battle.trackCount}</p>
                <p className="text-xs text-gray-500">Tracks</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced CTA button */}
        <div className="relative pt-4 border-t border-border-light group-hover:border-bts-purple/30 transition-colors duration-300">
          <button className="w-full btn-primary text-center text-sm py-3 flex items-center justify-center gap-2">
            <span className="font-bold">View Battle</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
