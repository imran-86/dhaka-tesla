import 'server-only';
import { serverFetch } from './server';
import type { TeslaStatusInfo } from '@/types';

export const teslaApi = {
  getStatus: async () => {
    const { tesla } = await serverFetch<{ tesla: TeslaStatusInfo }>(
      '/api/tesla/status',
    );
    console.log('teslaApi.getStatus', tesla);
    return tesla;
  },
};