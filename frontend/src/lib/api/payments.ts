import 'server-only';
import { serverFetch } from './server';
import type { Payment, PendingPaymentRide } from '@/types';

export const paymentsApi = {
  listMine: async () => {
    const { payments } = await serverFetch<{ payments: Payment[] }>(
      '/api/payments/me',
    );
    return payments;
  },

  listPendingRides: async () => {
    const { rides } = await serverFetch<{ rides: PendingPaymentRide[] }>(
      '/api/payments/pending',
    );
    return rides;
  },
};