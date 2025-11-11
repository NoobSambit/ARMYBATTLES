import { cn } from '@/lib/utils';

export default function Badge({ status, className }) {
  const statusConfig = {
    active: {
      label: 'Active',
      className: 'badge-active',
      icon: '🔴',
    },
    upcoming: {
      label: 'Upcoming',
      className: 'badge-upcoming',
      icon: '📅',
    },
    ended: {
      label: 'Ended',
      className: 'badge-ended',
      icon: '✓',
    },
  };

  const config = statusConfig[status] || statusConfig.upcoming;

  return (
    <span className={cn('badge', config.className, className)}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}
