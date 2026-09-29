'use client';

import { useActionState, useState } from 'react';
import { acceptRequestsAction } from '@/app/actions/driver';
import type { AcceptRequestsState } from '@/app/actions/driver';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatPoysha } from '@/lib/format';
import type { PendingRideRequest } from '@/types';

interface Props {
  requests: PendingRideRequest[];
  availableSeats: number;
}

export function PendingRequestList({ requests, availableSeats }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, isPending] = useActionState<
    AcceptRequestsState,
    FormData
  >(acceptRequestsAction, {});

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          No pending ride requests right now.
        </p>
      </div>
    );
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedSeats = requests
    .filter((r) => selected.has(r.id))
    .reduce((sum, r) => sum + r.seatsRequested, 0);

  const wouldExceed = selectedSeats > availableSeats;

  return (
    <form action={formAction} className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Pending ride requests
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Select one or more requests to accept into a pool.
        </p>
      </div>

      <ul className="divide-y divide-gray-100">
        {requests.map((req) => {
          const isSelected = selected.has(req.id);
          return (
            <li
              key={req.id}
              className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                name="rideRequestIds"
                value={req.id}
                checked={isSelected}
                onChange={() => toggle(req.id)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {req.pickupZone} → {req.destinationZone}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {req.seatsRequested} seat
                  {req.seatsRequested > 1 ? 's' : ''} ·{' '}
                  {formatPoysha(req.farePoysha)} ·{' '}
                  {formatDateTime(req.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-3 border-t border-gray-100 px-5 py-4">
        {state.error && <Alert variant="error">{state.error}</Alert>}
        {state.success && (
          <Alert variant="success">Pool created — see Active pool below.</Alert>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Selected: {selected.size} request{selected.size === 1 ? '' : 's'} ·{' '}
            {selectedSeats} seat{selectedSeats === 1 ? '' : 's'}
          </span>
          <span className="text-gray-500">
            {availableSeats} seat{availableSeats === 1 ? '' : 's'} available
          </span>
        </div>

        {wouldExceed && (
          <p className="text-xs text-red-700">
            Selected seats exceed available capacity.
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending || selected.size === 0 || wouldExceed}
          className="w-full"
        >
          {isPending
            ? 'Accepting…'
            : `Accept into pool${selected.size > 1 ? ' (share ride)' : ''}`}
        </Button>
      </div>
    </form>
  );
}