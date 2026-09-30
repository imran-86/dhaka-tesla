import { formatDateTime, formatPoysha } from '@/lib/format';
import { RideStatusBadge } from '@/components/passenger/RideStatusBadge';
import type { DriverPool } from '@/types';

interface Props {
  pools: DriverPool[];
}

export function PoolHistoryList({ pools }: Props) {
  if (pools.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          Completed trips will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Past trips</h2>
      </div>

      <ul className="divide-y divide-gray-100">
        {pools.map((pool) => {
          const passengerCount = new Set(
            pool.rideRequests.map((r) => r.passengerId),
          ).size;
          const revenue = pool.rideRequests.reduce(
            (sum, r) => sum + r.farePoysha,
            0,
          );

          return (
            <li key={pool.id} className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {pool.pickupZone} → {pool.corridor}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {pool.completedAt
                      ? formatDateTime(pool.completedAt)
                      : formatDateTime(pool.createdAt)}{' '}
                    · {passengerCount} passenger{passengerCount === 1 ? '' : 's'} ·{' '}
                    {pool.totalSeatsBooked}/{pool.tesla.capacity} seats
                  </p>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <RideStatusBadge status={pool.status} />
                  <span className="text-sm font-medium">
                    {formatPoysha(revenue)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}