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

// POST /api/rides — passenger only
rideRouter.post(
  '/',
  auth(Role.PASSENGER),
  validate(createRideSchema, 'body'),
  rideController.createRide,
);
// POST /api/rides/estimate — passenger-only, no DB writes
rideRouter.post(
  '/estimate',
  auth(Role.PASSENGER),
  validate(estimateRideSchema, 'body'),
  rideController.estimateRide,
);

// GET /api/rides/me — passenger only. NOTE: must be declared before /:id
rideRouter.get(
  '/me',
  auth(Role.PASSENGER),
  validate(listRidesQuerySchema, 'query'),
  rideController.listMyRides,
);

// GET /api/rides/:id — any logged-in user; ownership enforced in service
rideRouter.get(
  '/:id',
  auth(),
  validate(rideIdParamSchema, 'params'),
  rideController.getRideById,
);

// POST /api/rides/:id/cancel — passenger only; ownership enforced in service
rideRouter.post(
  '/:id/cancel',
  auth(Role.PASSENGER),
  validate(rideIdParamSchema, 'params'),
  rideController.cancelRide,
);

export default rideRouter;