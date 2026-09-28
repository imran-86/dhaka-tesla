import type { Request, Response } from 'express';

import type { CreateRideInput, ListRidesQuery } from './ride.schema.js';
import * as rideService from './ride.service.js';
import { catchAsync } from '../../common/utils/catchAsync.js';

export const createRide = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const ride = await rideService.createRide(user.id, req.body as CreateRideInput);
  res.status(201).json({ data: { ride } });
});

export const listMyRides = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const filters = req.validated!.query as ListRidesQuery;
  const rides = await rideService.listMyRides(user.id, filters);
  res.status(200).json({ data: { rides } });
});

export const getRideById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const params = req.validated!.params as { id: string };
  const ride = await rideService.getRideById(user.id, user.role, params.id);
  res.status(200).json({ data: { ride } });
});

export const cancelRide = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const params = req.validated!.params as { id: string };
  const ride = await rideService.cancelRide(user.id, params.id);
  res.status(200).json({ data: { ride } });
});