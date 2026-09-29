import Link from 'next/link';
import { formatDateTime, formatPoysha } from '@/lib/format';
import { RideStatusBadge } from './RideStatusBadge';
import type { RideRequest } from '@/types';

interface Props {
  rides: RideRequest[];
}

export function RecentRidesList({ rides }: Props) {
  if (rides.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          Your recent rides will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Recent rides</h2>
        <Link
          href="/passenger/history"
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          View all →
        </Link>
      </div>

      <ul className="divide-y divide-gray-100">
        {rides.map((ride) => (
          <li key={ride.id} className="flex items-center justify-between px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {ride.pickupZone} → {ride.destinationZone}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatDateTime(ride.createdAt)} · {ride.seatsRequested} seat
                {ride.seatsRequested > 1 ? 's' : ''}
              </p>
            </div>
            <div className="ml-4 flex items-center gap-3">
              <span className="text-sm font-medium">
                {formatPoysha(ride.farePoysha)}
              </span>
              <RideStatusBadge status={ride.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}