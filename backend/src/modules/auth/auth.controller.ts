import type { Request, Response } from 'express';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from './auth.constants.js';
import * as authService from './auth.service.js';

import type { ILoginUser, ISignupDriver, ISignupPassenger } from './auth.interface.js';
import { catchAsync } from '../../common/utils/catchAsync.js';

export const signupPassenger = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.signupPassenger(req.body as ISignupPassenger);

  res
    .cookie(AUTH_COOKIE_NAME, result.accessToken, AUTH_COOKIE_OPTIONS)
    .status(201)
    .json({ data: { user: result.user,
      accessToken: result.accessToken,
     } });
});

export const signupDriver = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.signupDriver(req.body as ISignupDriver);

  res
    .cookie(AUTH_COOKIE_NAME, result.accessToken, AUTH_COOKIE_OPTIONS)
    .status(201)
    .json({ data: { user: result.user,
      accessToken: result.accessToken,
     } });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as ILoginUser);

  res
    .cookie(AUTH_COOKIE_NAME, result.accessToken, AUTH_COOKIE_OPTIONS)
    .status(200)
    .json({ data: { user: result.user,
      accessToken: result.accessToken
     } });
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  res
    .clearCookie(AUTH_COOKIE_NAME, { ...AUTH_COOKIE_OPTIONS, maxAge: undefined })
    .status(204)
    .send();
});

export const me = catchAsync(async (req: Request, res: Response) => {
  // req.user is set by the auth middleware
  res.status(200).json({ data: { user: req.user } });
});