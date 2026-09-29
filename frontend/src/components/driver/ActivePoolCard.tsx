import { formatDateTime, formatPoysha } from '@/lib/format';
import { RideStatusBadge } from '@/components/passenger/RideStatusBadge';
import { PoolActionButtons } from './PoolActionButtons';
import type { DriverPool } from '@/types';

interface Props {
  pool: DriverPool;
}

export function ActivePoolCard({ pool }: Props) {
  const passengerCount = new Set(pool.rideRequests.map((r) => r.passengerId)).size;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Active pool</h2>
          <p className="mt-0.5 text-sm text-gray-600">
            {pool.tesla.name} · {pool.pickupZone} corridor
          </p>
        </div>
        <RideStatusBadge status={pool.status} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 text-sm">
        <div>
          <dt className="text-gray-500">Seats</dt>
          <dd className="mt-0.5 font-medium">
            {pool.totalSeatsBooked}/{pool.tesla.capacity}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Passengers</dt>
          <dd className="mt-0.5 font-medium">{passengerCount}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Requests</dt>
          <dd className="mt-0.5 font-medium">{pool.rideRequests.length}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Passengers
        </p>
        <ul className="mt-2 space-y-1.5">
          {pool.rideRequests.map((r) => (
            <li key={r.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {r.pickupZone} → {r.destinationZone}{' '}
                <span className="text-gray-400">
                  ({r.seatsRequested} seat{r.seatsRequested > 1 ? 's' : ''})
                </span>
              </span>
              <span className="font-medium">{formatPoysha(r.farePoysha)}</span>
            </li>
          ))}
        </ul>
      </div>

      {pool.startedAt && (
        <p className="mt-3 text-xs text-gray-500">
          Started {formatDateTime(pool.startedAt)}
        </p>
      )}

      <PoolActionButtons poolId={pool.id} status={pool.status} />
    </div>
  );
}