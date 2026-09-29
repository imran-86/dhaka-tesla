import { clsx } from 'clsx';
import type { TeslaStatusInfo } from '@/types';

interface Props {
  tesla: TeslaStatusInfo | null;
}

export function TeslaAvailabilityCard({ tesla }: Props) {
  if (!tesla) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">No Tesla available right now.</p>
      </div>
    );
  }

  const isFull = tesla.availableSeats === 0;
  const isOffline = tesla.status === 'OFFLINE';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚗</span>
            <h2 className="text-lg font-semibold">{tesla.name}</h2>
          </div>
          <p className="mt-0.5 text-sm text-gray-600">
            Driver: {tesla.driver.name}
          </p>
        </div>

        <span
          className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
            isOffline
              ? 'bg-gray-100 text-gray-700'
              : 'bg-green-100 text-green-800',
          )}
        >
          <span
            className={clsx(
              'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
              isOffline ? 'bg-gray-500' : 'bg-green-500',
            )}
          />
          {tesla.status}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
        <span className="text-gray-600">Seats</span>
        <span className="font-medium">
          {tesla.occupiedSeats}/{tesla.capacity} occupied
        </span>
      </div>

      <p
        className={clsx(
          'mt-2 text-sm',
          isOffline
            ? 'text-gray-500'
            : isFull
              ? 'text-amber-700'
              : 'text-green-700',
        )}
      >
        {isOffline
          ? 'Jashim is offline — you can still request, and he will decide when he returns.'
          : isFull
            ? 'Fully booked. You can still request — Jashim will decide.'
            : `${tesla.availableSeats} seat${tesla.availableSeats === 1 ? '' : 's'} free — request now and Jashim will confirm.`}
      </p>
    </div>
  );
}