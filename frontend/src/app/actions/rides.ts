'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch, ServerApiError } from '@/lib/api/server';
import { ridesApi, type EstimateInput, type EstimateResult } from '@/lib/api/rides';
import type { RideRequest } from '@/types';

// ------------------------------------------------------------------
// State shapes for useActionState
// ------------------------------------------------------------------

export interface CreateRideState {
  error?: string;
  success?: boolean;
}

export interface CancelRideState {
  error?: string;
  success?: boolean;
}

export interface EstimateState {
  error?: string;
  data?: EstimateResult;
}

// ------------------------------------------------------------------
// Create ride request
// ------------------------------------------------------------------

export async function createRideAction(
  _prev: CreateRideState,
  formData: FormData,
): Promise<CreateRideState> {
  const pickupZone = String(formData.get('pickupZone') ?? '').trim();
  const destinationZone = String(formData.get('destinationZone') ?? '').trim();
  const seatsRaw = String(formData.get('seatsRequested') ?? '1');
  const seatsRequested = Number.parseInt(seatsRaw, 10);

  if (!pickupZone || !destinationZone) {
    return { error: 'Pickup and destination are required.' };
  }
  if (pickupZone === destinationZone) {
    return { error: 'Pickup and destination must be different.' };
  }
  if (!Number.isInteger(seatsRequested) || seatsRequested < 1 || seatsRequested > 3) {
    return { error: 'Seats must be between 1 and 3.' };
  }

  try {
    await serverFetch<{ ride: RideRequest }>('/api/rides', {
      method: 'POST',
      body: { pickupZone, destinationZone, seatsRequested },
    });
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Network error. Please try again.' };
  }

  // Refresh the passenger dashboard — active ride card will appear.
  revalidatePath('/passenger');
  return { success: true };
}

// ------------------------------------------------------------------
// Cancel ride request
// ------------------------------------------------------------------

export async function cancelRideAction(
  _prev: CancelRideState,
  formData: FormData,
): Promise<CancelRideState> {
  const rideId = String(formData.get('rideId') ?? '').trim();
  if (!rideId) {
    return { error: 'Missing ride id.' };
  }

  try {
    await serverFetch<{ ride: RideRequest }>(`/api/rides/${rideId}/cancel`, {
      method: 'POST',
    });
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Network error. Please try again.' };
  }

  revalidatePath('/passenger');
  revalidatePath('/passenger/history');
  return { success: true };
}

// ------------------------------------------------------------------
// Estimate (called from a client component, NOT a form)
// ------------------------------------------------------------------

/**
 * Server Action used as a live fare preview.
 * Client component calls this whenever pickup/destination change.
 * Debounce on the client to avoid hammering the backend.
 */
export async function estimateRideAction(
  input: EstimateInput,
): Promise<EstimateState> {
  try {
    const estimate = await ridesApi.estimate(input);
    return { data: estimate };
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Could not calculate fare.' };
  }
}