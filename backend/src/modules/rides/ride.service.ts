import { FareService } from '../../common/services/fair.services.js';
import { AppError } from '../../common/utils/AppError.js';
import type { DhakaZone } from '../../common/utils/zones.constants.js';
import { Role, RideStatus } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';

import type { CreateRideInput, ListRidesQuery } from './ride.schema.js';
import { ACTIVE_RIDE_STATUSES, assertTransition } from './ride.stat.js';

/**
 * Create a ride request for a passenger.
 *
 * Rules enforced here:
 *   1. One active request (REQUESTED or MATCHED) per passenger.
 *   2. Route must be mapped in ZONE_DISTANCES_KM, otherwise FareService throws NO_ROUTE.
 *   3. farePoysha stored is the TOTAL (per-seat fare × seatsRequested).
 */
export async function createRide(passengerId: string, input: CreateRideInput) {
  // Rule 1: active-request guard
  const existing = await prisma.rideRequest.findFirst({
    where: { passengerId, status: { in: ACTIVE_RIDE_STATUSES } },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(
      409,
      'ACTIVE_REQUEST_EXISTS',
      'You already have an active ride request. Cancel it first.',
    );
  }

  // Rule 2: fare computed at request time (solo rate; recalculated on pooling)
  const perSeat = FareService.calculateFare(
    input.pickupZone as DhakaZone,
    input.destinationZone as DhakaZone,
    1, // passenger count = 1 (solo) at request time
  );

  // Rule 3: total fare
  const totalFarePoysha = perSeat.totalPoysha * input.seatsRequested;

  return prisma.rideRequest.create({
    data: {
      passengerId,
      pickupZone: input.pickupZone,
      destinationZone: input.destinationZone,
      seatsRequested: input.seatsRequested,
      farePoysha: totalFarePoysha,
      status: RideStatus.REQUESTED,
    },
  });
}

/**
 * List the calling passenger's rides, newest first.
 * Optional status filter.
 */
export async function listMyRides(
  passengerId: string,
  filters: ListRidesQuery,
) {
  return prisma.rideRequest.findMany({
    where: {
      passengerId,
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Fetch one ride.
 * Authorization:
 *   - Passenger: only if they own the ride.
 *   - Driver: only if the ride is assigned to one of their pools.
 *
 * Returns 404 (not 403) on unauthorized access to avoid leaking the
 * existence of other users' rides.
 */
export async function getRideById(
  userId: string,
  role: Role,
  rideId: string,
) {
  const ride = await prisma.rideRequest.findUnique({
    where: { id: rideId },
    include: {
      pool: {
        select: {
          id: true,
          tesla: { select: { driverId: true } },
        },
      },
    },
  });

  if (!ride) {
    throw new AppError(404, 'RIDE_NOT_FOUND', 'Ride not found.');
  }

  if (role === Role.PASSENGER) {
    if (ride.passengerId !== userId) {
      throw new AppError(404, 'RIDE_NOT_FOUND', 'Ride not found.');
    }
  } else if (role === Role.DRIVER) {
    const driverId = ride.pool?.tesla?.driverId;
    if (driverId !== userId) {
      throw new AppError(404, 'RIDE_NOT_FOUND', 'Ride not found.');
    }
  }

  return ride;
}

/**
 * Cancel a ride request.
 * Only allowed while status is REQUESTED or MATCHED (enforced by assertTransition).
 * Only the owning passenger may cancel.
 */
export async function cancelRide(passengerId: string, rideId: string) {
  const ride = await prisma.rideRequest.findFirst({
    where: { id: rideId, passengerId },
  });

  if (!ride) {
    throw new AppError(404, 'RIDE_NOT_FOUND', 'Ride not found.');
  }

  assertTransition(ride.status, RideStatus.CANCELLED);

  const updated = await prisma.rideRequest.update({
    where: { id: ride.id },
    data: { status: RideStatus.CANCELLED },
  });

  // TODO(pooling): if ride.poolId is not null, removing this passenger may
  // drop the pool below 2 passengers. At that point, remaining members'
  // fares must be recalculated back to the solo rate, inside the same
  // transaction. This hook will live here.

  return updated;
}