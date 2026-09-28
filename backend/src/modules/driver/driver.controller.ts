import type { Request, Response } from 'express';

import type { AcceptRequestsInput, SetDriverStatusInput } from './driver.schema.js';
import * as driverService from './driver.service.js';
import { catchAsync } from '../../common/utils/catchAsync.js';

export const setStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const input = req.validated!.body as SetDriverStatusInput;
  const tesla = await driverService.setDriverStatus(user.id, input);
  res.status(200).json({ data: { tesla } });
});

export const getStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const tesla = await driverService.getDriverStatus(user.id);
  res.status(200).json({ data: { tesla } });
});

export const listPendingRequests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const requests = await driverService.listPendingRequests(user.id);
  res.status(200).json({ data: { requests } });
});

export const listPools = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const pools = await driverService.listDriverPools(user.id);
  res.status(200).json({ data: { pools } });
});

export const acceptRequests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const input = req.validated!.body as AcceptRequestsInput;
  const pool = await driverService.acceptRideRequests(user.id, input);
  res.status(201).json({ data: { pool } });
});

export const startPool = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.validated!.params as { id: string };
  const pool = await driverService.startPool(user.id, id);
  res.status(200).json({ data: { pool } });
});

export const completePool = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.validated!.params as { id: string };
  const pool = await driverService.completePool(user.id, id);
  res.status(200).json({ data: { pool } });
});

export const cancelPool = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.validated!.params as { id: string };
  const pool = await driverService.cancelPool(user.id, id);
  res.status(200).json({ data: { pool } });
});