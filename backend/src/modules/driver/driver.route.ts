import { Router } from 'express';
import { Role } from '../../generated/prisma/enums.js';
import { auth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as driverController from './driver.controller.js';
import {
  acceptRequestsSchema,
  poolIdParamSchema,
  setDriverStatusSchema,
} from './driver.schema.js';

export const driverRouter = Router();

// Every route requires a driver.
driverRouter.use(auth(Role.DRIVER));

// Status
driverRouter.patch(
  '/status',
  validate(setDriverStatusSchema, 'body'),
  driverController.setStatus,
);
driverRouter.get('/status', driverController.getStatus);

// Pending requests + own pools
driverRouter.get('/requests', driverController.listPendingRequests);
driverRouter.get('/pools', driverController.listPools);

// Accept — the concurrency-sensitive endpoint
driverRouter.post(
  '/pools/accept',
  validate(acceptRequestsSchema, 'body'),
  driverController.acceptRequests,
);

// Lifecycle
driverRouter.post(
  '/pools/:id/start',
  validate(poolIdParamSchema, 'params'),
  driverController.startPool,
);
driverRouter.post(
  '/pools/:id/complete',
  validate(poolIdParamSchema, 'params'),
  driverController.completePool,
);
driverRouter.post(
  '/pools/:id/cancel',
  validate(poolIdParamSchema, 'params'),
  driverController.cancelPool,
);
driverRouter.get('/stats', driverController.getStats);
export default driverRouter;