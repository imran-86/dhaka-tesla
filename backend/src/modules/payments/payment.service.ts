import { AppError } from '../../common/utils/AppError.js';
import { PaymentMethod, PaymentStatus, RideStatus } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';
import type { CreatePaymentInput } from './payment.schema.js';

/**
 * Create (or complete) a payment for a completed ride.
 *
 * Rules:
 *   - The pool must be COMPLETED.
 *   - The passenger must own a ride in the pool.
 *   - One payment per (pool, passenger) — enforced by unique index.
 *   - Method is CASH or TESLAPAY; both are simulated, no real gateway.
 */
export async function createPayment(
  passengerId: string,
  input: CreatePaymentInput,
) {
  const pool = await prisma.pool.findUnique({
    where: { id: input.poolId },
    include: {
      rideRequests: {
        where: { passengerId, status: { not: RideStatus.CANCELLED } },
      },
    },
  });

  if (!pool) {
    throw new AppError(404, 'POOL_NOT_FOUND', 'Pool not found.');
  }
  if (pool.status !== RideStatus.COMPLETED) {
    throw new AppError(
      422,
      'POOL_NOT_COMPLETED',
      'You can only pay for a completed trip.',
    );
  }

  const ride = pool.rideRequests[0];
  if (!ride) {
    throw new AppError(
      404,
      'RIDE_NOT_FOUND',
      'No ride in this pool belongs to you.',
    );
  }

  const existing = await prisma.payment.findUnique({
    where: { poolId_passengerId: { poolId: pool.id, passengerId } },
  });

  if (existing?.status === PaymentStatus.COMPLETED) {
    throw new AppError(
      409,
      'ALREADY_PAID',
      'You have already paid for this trip.',
    );
  }

  return prisma.payment.upsert({
    where: { poolId_passengerId: { poolId: pool.id, passengerId } },
    create: {
      poolId: pool.id,
      passengerId,
      method: input.method as PaymentMethod,
      amountPaisa: ride.farePoysha,
      status: PaymentStatus.COMPLETED,
    },
    update: {
      method: input.method as PaymentMethod,
      status: PaymentStatus.COMPLETED,
    },
  });
}

/**
 * Return completed rides that still have no payment from this passenger.
 * Used by the dashboard to show the "Payment due" card.
 */
export async function listPendingPaymentRides(passengerId: string) {
  const rides = await prisma.rideRequest.findMany({
    where: {
      passengerId,
      status: RideStatus.COMPLETED,
      poolId: { not: null },
      pool: {
        status: RideStatus.COMPLETED,
        payments: {
          none: { passengerId, status: PaymentStatus.COMPLETED },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      pool: {
        select: {
          id: true,
          tesla: { select: { name: true } },
        },
      },
    },
  });

  return rides;
}

/** List every payment the current passenger has made. */
export async function listMyPayments(passengerId: string) {
  return prisma.payment.findMany({
    where: { passengerId },
    orderBy: { createdAt: 'desc' },
  });
}