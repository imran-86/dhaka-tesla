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

/**
 * Estimate fare for a prospective ride, without persisting anything.
 * Used by the frontend to show live fare preview as the passenger
 * selects pickup and destination.
 */
export const estimateRideSchema = z
  .object({
    pickupZone: zoneSchema,
    destinationZone: zoneSchema,
    seatsRequested: z.number().int().min(1).max(3).default(1),
  })
  .refine((d) => d.pickupZone !== d.destinationZone, {
    message: 'Pickup and destination must be different',
    path: ['destinationZone'],
  });

export type EstimateRideInput = z.infer<typeof estimateRideSchema>;

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