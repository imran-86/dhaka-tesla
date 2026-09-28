import bcrypt from 'bcryptjs';
import { Role, TeslaStatus } from '../../generated/prisma/enums.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

import type {
  IAuthResult,
  ILoginUser,
  IPublicUser,
  ISignupDriver,
  ISignupPassenger,
} from './auth.interface.js';
import { AppError } from '../../common/utils/AppError.js';
import { signToken } from '../../common/utils/jwt.js';

const BCRYPT_ROUNDS = 10;

/**
 * Shape of the user object we ever return to a client.
 * Never includes passwordHash.
 */
const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  tesla: {
    select: {
      id: true,
      name: true,
      capacity: true,
      status: true,
    },
  },
} as const;

// ------------------------------------------------------------------
// Signup
// ------------------------------------------------------------------

export async function signupPassenger(
  input: ISignupPassenger,
): Promise<IAuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(409, 'DUPLICATE_EMAIL', 'This email is already registered.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: Role.PASSENGER,
    },
    select: PUBLIC_USER_SELECT,
  });

  return { user, accessToken: issueToken(user) };
}

export async function signupDriver(input: ISignupDriver): Promise<IAuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(409, 'DUPLICATE_EMAIL', 'This email is already registered.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // Nested create is atomic — if Tesla creation fails, the User is rolled back too.
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: Role.DRIVER,
      tesla: {
        create: {
          name: input.vehicle.name,
          capacity: input.vehicle.capacity,
          status: TeslaStatus.OFFLINE,
        },
      },
    },
    select: PUBLIC_USER_SELECT,
  });

  return { user, accessToken: issueToken(user) };
}

// ------------------------------------------------------------------
// Login
// ------------------------------------------------------------------

export async function login(input: ILoginUser): Promise<IAuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      passwordHash: true,
      tesla: {
        select: { id: true, name: true, capacity: true, status: true },
      },
    },
  });

  // Generic error for BOTH "user not found" and "wrong password".
  // Returning different messages lets an attacker enumerate registered emails.
  const GENERIC = new AppError(
    401,
    'INVALID_CREDENTIALS',
    'Invalid email or password.',
  );

  if (!user) throw GENERIC;

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) throw GENERIC;

  const { passwordHash: _drop, ...publicUser } = user;

  return {
    user: publicUser,
    accessToken: issueToken(publicUser),
  };
}

// ------------------------------------------------------------------
// Internal
// ------------------------------------------------------------------

function issueToken(user: Pick<IPublicUser, 'id' | 'role'>): string {
  return signToken({ sub: user.id, role: user.role });
}