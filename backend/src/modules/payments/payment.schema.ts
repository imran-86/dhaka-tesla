import { z } from 'zod';

export const createPaymentSchema = z.object({
  poolId: z.string().uuid('Pool id must be a valid UUID'),
  method: z.enum(['CASH', 'TESLAPAY']),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid('Payment id must be a valid UUID'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;