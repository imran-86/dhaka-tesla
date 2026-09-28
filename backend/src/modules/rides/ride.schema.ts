import { z } from 'zod';
import { DHAKA_ZONES } from '../../common/utils/zones.constants';


const zoneSchema = z.enum(DHAKA_ZONES);

export const createRideSchema = z
  .object({
    pickupZone: zoneSchema,
    destinationZone: zoneSchema,
    seatsRequested: z.number().int().min(1).max(3).default(1),
  })
  .refine((d) => d.pickupZone !== d.destinationZone, {
    message: 'Pickup and destination must be different',
    path: ['destinationZone'],
  });

export const listRidesQuerySchema = z.object({
  status: z
    .enum(['REQUESTED', 'MATCHED', 'COMPLETED', 'CANCELLED'])
    .optional(),
});

export const rideIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type ListRidesQuery = z.infer<typeof listRidesQuerySchema>;