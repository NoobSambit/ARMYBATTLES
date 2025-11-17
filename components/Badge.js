import { cn } from '@/lib/utils';

export default function Badge({ status, className }) {
  const statusConfig = {
    active: {
      label: 'Active',
      className: 'badge-active',
    },
    upcoming: {
      label: 'Upcoming',
      className: 'badge-upcoming',
    },
    ended: {
      label: 'Ended',
      className: 'badge-ended',
    },
  };

  const config = statusConfig[status] || statusConfig.upcoming;

  return (
    <span className={cn('badge', config.className, className)}>{config.label}</span>
  );
}
