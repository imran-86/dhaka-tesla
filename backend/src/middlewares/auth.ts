import type { Request } from 'express';
import { Role } from '../generated/prisma/enums.js';
import { env } from '../config/env.js'; // not strictly needed here, remove if unused
import { prisma } from '../lib/prisma.js';
import { AUTH_COOKIE_NAME } from '../modules/auth/auth.constants.js';
import { catchAsync } from '../common/utils/catchAsync.js';
import { AppError } from '../common/utils/AppError.js';
import { verifyToken } from '../common/utils/jwt.js';


/**
 * Extract JWT from either:
 *   1. httpOnly cookie `accessToken` (browser flow)
 *   2. `Authorization: Bearer <token>` header (curl / tests / API clients)
 */
function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }

  return null;
}

/**
 * Usage:
 *   router.get('/me', auth(), getMe)                         // any logged-in user
 *   router.post('/pools', auth(Role.DRIVER), createPool)     // driver only
 *   router.get('/rides', auth(Role.PASSENGER, Role.DRIVER))  // either
 */
export const auth = (...requiredRoles: Role[]) =>
  catchAsync(async (req, _res, next) => {
    const token = extractToken(req);
    if (!token) {
      throw new AppError(
        401,
        'NOT_AUTHENTICATED',
        'You are not logged in. Please log in to access this resource.',
      );
    }

    const payload = verifyToken(token); // throws AppError(401) on bad token

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError(
        401,
        'USER_NOT_FOUND',
        'Your session is no longer valid. Please log in again.',
      );
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'You do not have permission to access this resource.',
      );
    }

    req.user = user;
    next();
  });