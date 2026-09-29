import { Router } from 'express';
import { Role } from '../../generated/prisma/enums.js';
import { auth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as paymentController from './payment.controller.js';
import { createPaymentSchema } from './payment.schema.js';

export const paymentRouter = Router();

paymentRouter.use(auth(Role.PASSENGER));

paymentRouter.post(
  '/',
  validate(createPaymentSchema, 'body'),
  paymentController.createPayment,
);

paymentRouter.get('/me', paymentController.listMyPayments);

paymentRouter.get('/pending', paymentController.listPendingPaymentRides);

export default paymentRouter;