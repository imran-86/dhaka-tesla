import type { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync.js';
import * as paymentService from './payment.service.js';
import type { CreatePaymentInput } from './payment.schema.js';

export const createPayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const input = req.validated!.body as CreatePaymentInput;
  const payment = await paymentService.createPayment(user.id, input);
  res.status(201).json({ data: { payment } });
});

export const listMyPayments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const payments = await paymentService.listMyPayments(user.id);
  res.status(200).json({ data: { payments } });
});

export const listPendingPaymentRides = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const rides = await paymentService.listPendingPaymentRides(user.id);
    res.status(200).json({ data: { rides } });
  },
);