import Link from 'next/link';
import { formatDateTime, formatPoysha } from '@/lib/format';
import type { PendingPaymentRide } from '@/types';

interface Props {
  ride: PendingPaymentRide;
}

export function CompletedRideCard({ ride }: Props) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-amber-900">
            Payment due
          </h2>
          <p className="mt-0.5 text-sm text-amber-800">
            {ride.pickupZone} → {ride.destinationZone} · {ride.pool.tesla.name}
          </p>
        </div>
        <span className="text-lg font-semibold text-amber-900">
          {formatPoysha(ride.farePoysha)}
        </span>
      </div>

      <p className="mt-3 text-xs text-amber-800">
        Trip completed {formatDateTime(ride.createdAt)}. Settle this before
        requesting another ride.
      </p>

      <Link
        href={`/passenger/pay/${ride.id}`}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
      >
        Pay now →
      </Link>
    </div>
  );
}