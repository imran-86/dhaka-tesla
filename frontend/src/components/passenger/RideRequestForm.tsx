'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { createRideAction, estimateRideAction } from '@/app/actions/rides';
import type { CreateRideState } from '@/app/actions/rides';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DHAKA_ZONES } from '@/lib/constants';
import { formatPoysha } from '@/lib/format';
import type { FareEstimate } from '@/types';

const selectClass =
  'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900';

export function RideRequestForm() {
  const [state, formAction, isPending] = useActionState<CreateRideState, FormData>(
    createRideAction,
    {},
  );

  const [pickup, setPickup] = useState<string>('Banani');
  const [destination, setDestination] = useState<string>('Mohakhali');
  const [seats, setSeats] = useState<number>(1);

  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [isEstimating, startTransition] = useTransition();

  // Live fare preview — debounced call to the server action.
   // Derived: validation is computed during render, not stored in state.
  const validationError =
    !pickup || !destination
      ? 'Pickup and destination are required.'
      : pickup === destination
        ? 'Pickup and destination must differ.'
        : null;

  // Live fare preview — debounced call to the server action.
  useEffect(() => {
    if (validationError) {
      // No synchronous setState here — just skip.
      return;
    }

    const handle = setTimeout(() => {
      startTransition(async () => {
        const result = await estimateRideAction({
          pickupZone: pickup,
          destinationZone: destination,
          seatsRequested: seats,
        });
        if (result.error) {
          setEstimate(null);
          setEstimateError(result.error);
        } else {
          setEstimate(result.data ?? null);
          setEstimateError(null);
        }
      });
    }, 300);

    return () => clearTimeout(handle);
  }, [pickup, destination, seats, validationError]);

  return (
    <form action={formAction} className="space-y-4">
      <h2 className="text-lg font-semibold">Request a ride</h2>

      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && (
        <Alert variant="success">
          Ride requested. Waiting for the driver to confirm.
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Pickup zone
        </label>
        <select
          name="pickupZone"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          className={`mt-1 ${selectClass}`}
        >
          {DHAKA_ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Destination zone
        </label>
        <select
          name="destinationZone"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className={`mt-1 ${selectClass}`}
        >
          {DHAKA_ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      <Input
        name="seatsRequested"
        type="number"
        label="Seats"
        min={1}
        max={3}
        value={seats}
        onChange={(e) => setSeats(Number(e.target.value) || 1)}
      />

      {/* Live fare preview */}
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Fare preview
        </p>

                {validationError ? (
          <p className="mt-2 text-sm text-red-700">{validationError}</p>
        ) : estimateError ? (
          <p className="mt-2 text-sm text-red-700">{estimateError}</p>
        ) : isEstimating ? (
          <p className="mt-2 text-sm text-gray-500">Calculating…</p>
        ) : estimate ? (
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Distance</span>
              <span>{estimate.distanceKm} km</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Solo fare</span>
              <span>{formatPoysha(estimate.soloFarePoysha)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-900">
              <span>
                Pooled fare{' '}
                <span className="text-green-700">
                  (save {estimate.discountPercent}%)
                </span>
              </span>
              <span>{formatPoysha(estimate.pooledFarePoysha)}</span>
            </div>
            <p className="pt-1 text-xs text-gray-500">
              You pay the solo fare now. If someone shares your ride, it drops
              automatically.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            Select pickup and destination to see fares.
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending || !estimate}
        className="w-full"
      >
        {isPending ? 'Requesting…' : 'Request ride'}
      </Button>
    </form>
  );
}