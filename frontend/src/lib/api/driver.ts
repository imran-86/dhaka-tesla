import 'server-only';
import { serverFetch } from './server';
import type { DriverPool, DriverTeslaStatus, PendingRideRequest } from '@/types';

export const driverApi = {
  getStatus: async () => {
    const { tesla } = await serverFetch<{ tesla: DriverTeslaStatus }>(
      '/api/driver/status',
    );
    return tesla;
  },

  listPendingRequests: async () => {
    const { requests } = await serverFetch<{ requests: PendingRideRequest[] }>(
      '/api/driver/requests',
    );
    return requests;
  },

  listPools: async () => {
    const { pools } = await serverFetch<{ pools: DriverPool[] }>(
      '/api/driver/pools',
    );
    return pools;
  },
};
