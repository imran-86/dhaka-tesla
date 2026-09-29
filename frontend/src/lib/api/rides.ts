import 'server-only';
import { serverFetch } from './server';
import type { RideRequest, RideStatus } from '@/types';

// ------------------------------------------------------------------
// Read operations (used from Server Components)
// ------------------------------------------------------------------

export interface EstimateResult {
  distanceKm: number;
  seatsRequested: number;
  soloFarePoysha: number;
  pooledFarePoysha: number;
  savingsPoysha: number;
  discountPercent: number;
}

export interface EstimateInput {
  pickupZone: string;
  destinationZone: string;
  seatsRequested?: number;
}

export const ridesApi = {
  /**
   * List the current passenger's rides.
   * Optional status filter.
   */
  listMine: async (status?: RideStatus) => {
    const qs = status ? `?status=${status}` : '';
    const { rides } = await serverFetch<{ rides: RideRequest[] }>(
      `/api/rides/me${qs}`,
    );
    return rides;
  },

  /** Fetch a single ride by id. Ownership enforced backend-side. */
  getById: async (id: string) => {
    const { ride } = await serverFetch<{ ride: RideRequest }>(
      `/api/rides/${id}`,
    );
    return ride;
  },

  /**
   * Server-side fare estimate.
   * Callable from Server Components or Server Actions.
   * Not exposed as a client-side action — the form calls the action.
   */
  estimate: async (input: EstimateInput) => {
    const { estimate } = await serverFetch<{ estimate: EstimateResult }>(
      '/api/rides/estimate',
      { method: 'POST', body: input },
    );
    return estimate;
  },
};