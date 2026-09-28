import { z } from 'zod';

export const setDriverStatusSchema = z.object({
  status: z.enum(['ONLINE', 'OFFLINE']),
});

export const acceptRequestsSchema = z.object({
  rideRequestIds: z
    .array(z.string().uuid('Each ride request id must be a valid UUID'))
    .min(1, 'Select at least one ride request')
    .max(3, 'Bullet has at most 3 seats'),
});

export const poolIdParamSchema = z.object({
  id: z.string().uuid('Pool id must be a valid UUID'),
});

export type SetDriverStatusInput = z.infer<typeof setDriverStatusSchema>;
export type AcceptRequestsInput = z.infer<typeof acceptRequestsSchema>;