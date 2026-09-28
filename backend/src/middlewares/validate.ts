import type { NextFunction, Request, Response } from 'express';
import { type ZodType } from 'zod';

type Target = 'body' | 'query' | 'params';

// Augment the Express Request type so controller code stays type-safe.
declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export const validate =
  (schema: ZodType, target: Target = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(result.error);
      return;
    }

    if (!req.validated) req.validated = {};
    req.validated[target] = result.data;

    next();
  };