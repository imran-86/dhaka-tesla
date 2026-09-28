import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';


import { env } from './config/env.js';
import authRouter from './modules/auth/auth.route.js';
import { rideRouter } from './modules/rides/ride.route.js';





  const app = express();

  
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

app.get("/", (req : Request, res : Response) => {
    res.send("Hello, World!");
});
  

app.use('/api/auth', authRouter);
app.use('/api/rides', rideRouter);

 

export default app;