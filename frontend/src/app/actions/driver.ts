'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch, ServerApiError } from '@/lib/api/server';
import type { DriverPool, DriverTeslaStatus } from '@/types';

// ------------------------------------------------------------------
// State shapes
// ------------------------------------------------------------------

export interface StatusToggleState {
  error?: string;
  success?: boolean;
}

export interface AcceptRequestsState {
  error?: string;
  success?: boolean;
  poolId?: string;
}

export interface PoolActionState {
  error?: string;
  success?: boolean;
}

// ------------------------------------------------------------------
// Status toggle
// ------------------------------------------------------------------

export async function setDriverStatusAction(
  _prev: StatusToggleState,
  formData: FormData,
): Promise<StatusToggleState> {
  const status = String(formData.get('status') ?? '').toUpperCase();
  if (status !== 'ONLINE' && status !== 'OFFLINE') {
    return { error: 'Invalid status.' };
  }

  try {
    await serverFetch<{ tesla: DriverTeslaStatus }>('/api/driver/status', {
      method: 'PATCH',
      body: { status },
    });
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Network error. Please try again.' };
  }

  revalidatePath('/driver');
  return { success: true };
}

// ------------------------------------------------------------------
// Accept requests (create/extend pool)
// ------------------------------------------------------------------

export async function acceptRequestsAction(
  _prev: AcceptRequestsState,
  formData: FormData,
): Promise<AcceptRequestsState> {
  const rideRequestIds = formData
    .getAll('rideRequestIds')
    .map((v) => String(v))
    .filter((v) => v.length > 0);

  if (rideRequestIds.length === 0) {
    return { error: 'Select at least one ride request.' };
  }

  let pool: DriverPool;
  try {
    const result = await serverFetch<{ pool: DriverPool }>(
      '/api/driver/pools/accept',
      { method: 'POST', body: { rideRequestIds } },
    );
    pool = result.pool;
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Network error. Please try again.' };
  }

  revalidatePath('/driver');
  return { success: true, poolId: pool.id };
}

// ------------------------------------------------------------------
// Pool lifecycle: start / complete / cancel
// ------------------------------------------------------------------

async function poolAction(
  poolId: string,
  action: 'start' | 'complete' | 'cancel',
): Promise<PoolActionState> {
  if (!poolId) return { error: 'Missing pool id.' };
  try {
    await serverFetch<{ pool: DriverPool }>(
      `/api/driver/pools/${poolId}/${action}`,
      { method: 'POST' },
    );
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Network error. Please try again.' };
  }
  revalidatePath('/driver');
  return { success: true };
}

export async function startPoolAction(
  _prev: PoolActionState,
  formData: FormData,
): Promise<PoolActionState> {
  return poolAction(String(formData.get('poolId') ?? ''), 'start');
}

export async function completePoolAction(
  _prev: PoolActionState,
  formData: FormData,
): Promise<PoolActionState> {
  return poolAction(String(formData.get('poolId') ?? ''), 'complete');
}

export async function cancelPoolAction(
  _prev: PoolActionState,
  formData: FormData,
): Promise<PoolActionState> {
  return poolAction(String(formData.get('poolId') ?? ''), 'cancel');
}