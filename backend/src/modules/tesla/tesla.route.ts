import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import * as teslaController from './tesla.controller.js';

export const teslaRouter = Router();

// Any logged-in user can see Tesla availability.
teslaRouter.get('/status', auth(), teslaController.getStatus);

export default teslaRouter;