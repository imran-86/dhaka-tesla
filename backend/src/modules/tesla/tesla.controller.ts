import type { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync.js';
import * as teslaService from './tesla.service.js';

export const getStatus = catchAsync(async (_req: Request, res: Response) => {
  const tesla = await teslaService.getActiveTeslaStatus();
  res.status(200).json({ data: { tesla } });
});