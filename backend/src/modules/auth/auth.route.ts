import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { auth } from '../../middlewares/auth.js';
import {
  loginSchema,
  signupDriverSchema,
  signupPassengerSchema,
} from './auth.schema.js';

export const authRouter = Router();

authRouter.post(
  '/signup/passenger',
  validate(signupPassengerSchema),
  authController.signupPassenger,
);

authRouter.post(
  '/signup/driver',
  validate(signupDriverSchema),
  authController.signupDriver,
);

authRouter.post('/login', validate(loginSchema), authController.login);

authRouter.post('/logout', authController.logout);

authRouter.get('/me', auth(), authController.me);

export default authRouter;