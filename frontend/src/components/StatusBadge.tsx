import React from 'react';

type StatusType =
  | 'ACTIVE'
  | 'ON_TRIP'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE'
  | 'RETIRED'
  | 'SUSPENDED'
  | 'INACTIVE'
  | 'DRAFT'
  | 'DISPATCHED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS';

interface StatusBadgeProps {
  status: StatusType | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const norm = status.toUpperCase();

  let styles = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700';

  if (norm === 'ACTIVE' || norm === 'COMPLETED' || norm === 'APPROVED') {
    styles = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
  } else if (norm === 'ON_TRIP' || norm === 'DISPATCHED' || norm === 'SCHEDULED') {
    styles = 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30';
  } else if (norm === 'MAINTENANCE' || norm === 'IN_PROGRESS') {
    styles = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
  } else if (norm === 'OUT_OF_SERVICE' || norm === 'SUSPENDED' || norm === 'CANCELLED' || norm === 'REJECTED') {
    styles = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
  } else if (norm === 'PENDING') {
    styles = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-900/30';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide capitalize ${styles}`}>
      {status.toLowerCase().replace('_', ' ')}
    </span>
  );
}
export default StatusBadge;
