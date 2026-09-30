import { formatDateTime, formatPoysha } from '@/lib/format';
import { RideStatusBadge } from './RideStatusBadge';
import { CancelRideButton } from './CancelRideButton';
import type { RideRequest } from '@/types';

interface Props {
  ride: RideRequest;
}

export function ActiveRideCard({ ride }: Props) {
  const canCancel = ride.status === 'REQUESTED' || ride.status === 'MATCHED';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your active ride</h2>
          <p className="mt-0.5 text-sm text-gray-600">
            {ride.pickupZone} → {ride.destinationZone}
          </p>
        </div>
        <RideStatusBadge status={ride.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
        <div>
          <dt className="text-gray-500">Seats</dt>
          <dd className="mt-0.5 font-medium">{ride.seatsRequested}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Fare</dt>
          <dd className="mt-0.5 font-medium">{formatPoysha(ride.farePoysha)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Requested</dt>
          <dd className="mt-0.5">{formatDateTime(ride.createdAt)}</dd>
        </div>
      </dl>

      {ride.status === 'REQUESTED' && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Waiting for a driver to confirm. You can cancel any time before the
          trip starts.
        </p>
      )}

      {ride.status === 'MATCHED' && (
        <p className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Jashim has confirmed your ride. Sit tight — he will arrive shortly.
        </p>
      )}

      {canCancel && (
        <div className="mt-4">
          <CancelRideButton rideId={ride.id} />
        </div>
      )}
    </div>
  );
}