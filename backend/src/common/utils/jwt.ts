import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';

import { AppError } from './AppError.js';
import { env } from '../../config/env.js';


export interface AuthTokenPayload extends JwtPayload {
  sub: string;       // user id
  role: 'PASSENGER' | 'DRIVER';
}

export function signToken(payload: { sub: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.sub || !decoded.role) {
      throw new Error('Malformed token payload');
    }
    return decoded as AuthTokenPayload;
  } catch {
    // Do not leak the reason — invalid signature vs expired looks identical
    // to an attacker, and that's intentional.
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
}