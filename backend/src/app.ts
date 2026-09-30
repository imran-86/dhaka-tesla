import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import authRouter from './modules/auth/auth.route.js';
import { rideRouter } from './modules/rides/ride.route.js';
import driverRouter from './modules/driver/driver.route.js';
import { teslaRouter } from './modules/tesla/tesla.route.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/', (_req: Request, res: Response) => {
    res.send('Hello, World!');
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/rides', rideRouter);
  app.use('/api/driver', driverRouter);
  app.use('/api/tesla', teslaRouter);
  app.use('/api/payments', paymentRouter);

  // 404 for unmatched routes + consistent JSON error shape.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Default instance for production (server.ts imports this).
 * Tests should prefer createApp() for isolation.
 */
const app = createApp();
export default app;