import type { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { ZodError } from 'zod';
import { AppError } from '../common/utils/AppError';


export function notFoundHandler(_req: Request, res: Response) {
  res.status(status.NOT_FOUND).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  if (err instanceof ZodError) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: err.flatten(),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.error('[UNHANDLED ERROR]', err);

  res.status(status.INTERNAL_SERVER_ERROR).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}