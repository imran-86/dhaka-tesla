import { Router } from 'express';
import { Role } from '../../generated/prisma/enums.js';
import { auth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as rideController from './ride.controller.js';
import {
  createRideSchema,
  estimateRideSchema,
  listRidesQuerySchema,
  rideIdParamSchema,
} from './ride.schema.js';

export const rideRouter = Router();

// POST /api/rides — passenger creates a ride request
rideRouter.post(
  '/',
  auth(Role.PASSENGER),
  validate(createRideSchema, 'body'),
  rideController.createRide,
);

// POST /api/rides/estimate — passenger-only fare preview (no DB writes)
rideRouter.post(
  '/estimate',
  auth(Role.PASSENGER),
  validate(estimateRideSchema, 'body'),
  rideController.estimateRide,
);

// GET /api/rides/corridors — PUBLIC corridor map (used by the request form).
// No auth: this is static configuration, not user data.
rideRouter.get('/corridors', rideController.listCorridors);

// GET /api/rides/me — passenger lists own rides
rideRouter.get(
  '/me',
  auth(Role.PASSENGER),
  validate(listRidesQuerySchema, 'query'),
  rideController.listMyRides,
);

// GET /api/rides/:id — any authenticated user; ownership checked in service
rideRouter.get(
  '/:id',
  auth(),
  validate(rideIdParamSchema, 'params'),
  rideController.getRideById,
);

// POST /api/rides/:id/cancel — owner passenger only
rideRouter.post(
  '/:id/cancel',
  auth(Role.PASSENGER),
  validate(rideIdParamSchema, 'params'),
  rideController.cancelRide,
);