import { clsx } from 'clsx';
import type { RideStatus } from '@/types';

const LABELS: Record<RideStatus, string> = {
  REQUESTED: 'Requested',
  MATCHED: 'Matched',
  DRIVER_ARRIVED: 'Driver arriving',
  STARTED: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const COLORS: Record<RideStatus, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  MATCHED: 'bg-blue-100 text-blue-800',
  DRIVER_ARRIVED: 'bg-indigo-100 text-indigo-800',
  STARTED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function RideStatusBadge({ status }: { status: RideStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        COLORS[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}