import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import Badge from './Badge';

export default function BattleCard({ battle }) {
  return (
    <div className="card p-6 hover:shadow-card-hover transition-transform duration-200">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-100 line-clamp-2">{battle.name}</h3>
        <Badge status={battle.status} />
      </div>

      <div className="space-y-2 text-sm text-gray-400 mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{battle.participantCount || 0} participants</span>
        </div>
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatDate(battle.startTime)}</span>
        </div>
        {battle.trackCount && (
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span>{battle.trackCount} tracks</span>
          </div>
        )}
      </div>

      <Link href={`/battle/${battle.id}`}>
        <button className="w-full btn-primary text-center">
          View Battle
        </button>
      </Link>
    </div>
  );
}
