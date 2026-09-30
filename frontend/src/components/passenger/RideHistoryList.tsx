import { formatDateTime, formatPoysha } from '@/lib/format';
import { RideStatusBadge } from './RideStatusBadge';
import type { Payment, RideRequest } from '@/types';

interface Props {
  rides: RideRequest[];
  payments: Payment[];
}

export function RideHistoryList({ rides, payments }: Props) {
  // Index payments by poolId for quick lookup.
  const paidByPool = new Map<string, Payment>();
  for (const p of payments) {
    paidByPool.set(p.poolId, p);
  }

  if (rides.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          Your trips will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">All trips</h2>
      </div>

      <ul className="divide-y divide-gray-100">
        {rides.map((ride) => {
          const payment = ride.poolId ? paidByPool.get(ride.poolId) : undefined;
          const isCompleted = ride.status === 'COMPLETED';
          const paymentLabel = !isCompleted
            ? null
            : payment
              ? `Paid · ${payment.method === 'CASH' ? 'Cash' : 'TeslaPay'}`
              : 'Payment due';

          return (
            <li key={ride.id} className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {ride.pickupZone} → {ride.destinationZone}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatDateTime(ride.createdAt)} · {ride.seatsRequested} seat
                    {ride.seatsRequested > 1 ? 's' : ''}
                  </p>
                  {paymentLabel && (
                    <p
                      className={
                        'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ' +
                        (payment
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800')
                      }
                    >
                      {paymentLabel}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <RideStatusBadge status={ride.status} />
                  <span className="text-sm font-medium">
                    {formatPoysha(ride.farePoysha)}
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