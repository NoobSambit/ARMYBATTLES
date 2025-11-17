import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getBattleStatus(battle) {
  const now = new Date();
  const start = new Date(battle.startTime);
  const end = new Date(battle.endTime);
  
  if (battle.status === 'ended') return 'ended';
  if (now >= end) return 'ended';
  if (now >= start) return 'active';
  return 'upcoming';
}
