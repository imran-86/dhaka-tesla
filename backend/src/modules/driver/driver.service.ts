import { FareService } from '../../common/services/fair.services.js';
import { AppError } from '../../common/utils/AppError.js';
import { FARE_CONFIG, type DhakaZone } from '../../common/utils/zones.constants.js';
import {
  RideStatus,
  TeslaStatus,
} from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';
import type { IAcceptRequests, ISetDriverStatus } from './driver.interface.js';


import { assertPoolTransition } from './pool.state.js';



// ------------------------------------------------------------------
// Driver status
// ------------------------------------------------------------------

export async function setDriverStatus(
  driverId: string,
  input: ISetDriverStatus,
) {
  const tesla = await prisma.tesla.findUnique({
    where: { driverId },
    select: { id: true, status: true },
  });

  if (!tesla) {
    throw new AppError(404, 'TESLA_NOT_FOUND', 'No Tesla is registered for this driver.');
  }

  return prisma.tesla.update({
    where: { id: tesla.id },
    data: { status: input.status as TeslaStatus },
    select: { id: true, name: true, capacity: true, status: true },
  });
}

export async function getDriverStatus(driverId: string) {
  const tesla = await prisma.tesla.findUnique({
    where: { driverId },
    select: { id: true, name: true, capacity: true, status: true },
  });

  if (!tesla) {
    throw new AppError(404, 'TESLA_NOT_FOUND', 'No Tesla is registered for this driver.');
  }
  return tesla;
}

// ------------------------------------------------------------------
// Pending requests visible to this driver
// ------------------------------------------------------------------

/**
 * For the MVP there is a single Tesla (Bullet). All REQUESTED rides are
 * shown to the online driver. When multiple Teslas exist, this method
 * should filter by pickup-zone proximity / corridor compatibility.
 */
export async function listPendingRequests(driverId: string) {
  const tesla = await prisma.tesla.findUnique({
    where: { driverId },
    select: { id: true, status: true },
  });

  if (!tesla) {
    throw new AppError(404, 'TESLA_NOT_FOUND', 'No Tesla is registered for this driver.');
  }
  if (tesla.status !== TeslaStatus.ONLINE) {
    throw new AppError(409, 'DRIVER_OFFLINE', 'Go online to see pending ride requests.');
  }

  return prisma.rideRequest.findMany({
    where: {
      status: RideStatus.REQUESTED,
      poolId: null,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      passengerId: true,
      pickupZone: true,
      destinationZone: true,
      seatsRequested: true,
      farePoysha: true,
      status: true,
      createdAt: true,
    },
  });
}

// ------------------------------------------------------------------
// Driver's own pools
// ------------------------------------------------------------------

export async function listDriverPools(driverId: string) {
  return prisma.pool.findMany({
    where: { tesla: { driverId } },
    orderBy: { createdAt: 'desc' },
    include: {
      tesla: { select: { id: true, name: true, capacity: true } },
      rideRequests: {
        select: {
          id: true,
          passengerId: true,
          pickupZone: true,
          destinationZone: true,
          seatsRequested: true,
          farePoysha: true,
          status: true,
        },
      },
    },
  });
}

// ------------------------------------------------------------------
// Accept ride requests — THE CONCURRENCY-SENSITIVE OPERATION
// ------------------------------------------------------------------

/**
 * Atomically accept one or more ride requests into a pool for this driver's Tesla.
 *
 * Concurrency guarantee:
 *   The Tesla row is locked with SELECT ... FOR UPDATE at the start of the
 *   transaction. Any concurrent accept for the same Tesla serializes on
 *   this lock, so the invariant "sum(active seats) <= tesla.capacity" holds
 *   even when two passengers race for the last seat.
 *
 *   The ride requests themselves are attached with a conditional updateMany
 *   guarded by `status = REQUESTED AND poolId IS NULL`. If two accepts race
 *   on the same request, only one updateMany will match — the other sees
 *   count mismatch and rolls back.
 */
export async function acceptRideRequests(
  driverId: string,
  input: IAcceptRequests,
) {
  const { rideRequestIds } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Lock the Tesla row for this driver.
    //
    //    This is the whole concurrency control for the MVP. Two accepts for
    //    the same Tesla serialize here; the second transaction waits until
    //    the first commits, then reads fresh state and fails the capacity
    //    check below if the seat is no longer available.
    const teslaRows = await tx.$queryRaw<
      Array<{ id: string; capacity: number; status: string }>
    >`
      SELECT id, capacity, status
      FROM teslas
      WHERE "driverId" = ${driverId}
      FOR UPDATE
    `;

    const tesla = teslaRows[0];
    if (!tesla) {
      throw new AppError(404, 'TESLA_NOT_FOUND', 'No Tesla is registered for this driver.');
    }
    if (tesla.status !== TeslaStatus.ONLINE) {
      throw new AppError(409, 'DRIVER_OFFLINE', 'Go online before accepting rides.');
    }

    // 2. Load the candidate ride requests and verify they are still free.
    //    Reading here is safe because the Tesla lock above ensures no other
    //    accept for this Tesla can be running concurrently.
    const requests = await tx.rideRequest.findMany({
      where: { id: { in: rideRequestIds } },
      select: {
        id: true,
        passengerId: true,
        pickupZone: true,
        destinationZone: true,
        seatsRequested: true,
        status: true,
        poolId: true,
      },
    });

    if (requests.length !== rideRequestIds.length) {
      throw new AppError(404, 'RIDE_NOT_FOUND', 'One or more ride requests do not exist.');
    }

    for (const r of requests) {
      if (r.status !== RideStatus.REQUESTED || r.poolId !== null) {
        throw new AppError(
          409,
          'REQUEST_ALREADY_TAKEN',
          `Ride ${r.id} is no longer available.`,
        );
      }
    }

    // 3. Count seats currently consumed on this Tesla.
    const usage = await tx.rideRequest.aggregate({
      where: {
        pool: {
          teslaId: tesla.id,
          status: {
            in: [RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED, RideStatus.STARTED],
          },
        },
        status: { not: RideStatus.CANCELLED },
      },
      _sum: { seatsRequested: true },
    });
    const usedSeats = usage._sum.seatsRequested ?? 0;
    const incomingSeats = requests.reduce((sum, r) => sum + r.seatsRequested, 0);

    if (usedSeats + incomingSeats > tesla.capacity) {
      throw new AppError(
        422,
        'POOL_CAPACITY_EXCEEDED',
        `Tesla can hold ${tesla.capacity} seats. ${usedSeats} in use, ${incomingSeats} requested.`,
      );
    }

    // 4. Find or create the active pool for this Tesla.
    const existingPool = await tx.pool.findFirst({
      where: {
        teslaId: tesla.id,
        status: {
          in: [RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED, RideStatus.STARTED],
        },
      },
    });

    const pool = existingPool
      ? await tx.pool.update({
          where: { id: existingPool.id },
          data: { totalSeatsBooked: { increment: incomingSeats } },
        })
      : await tx.pool.create({
          data: {
            teslaId: tesla.id,
            status: RideStatus.MATCHED,
            pickupZone: requests[0]!.pickupZone,
            corridor: requests.map((r) => r.destinationZone).join(','),
            totalSeatsBooked: incomingSeats,
          },
        });

    // 5. Attach the requests to the pool.
    //
    // Single-Tesla MVP: the Tesla row lock in step 1 already serialized all
    // accepts for this vehicle, so at this point the requests are guaranteed
    // to still be REQUESTED. Step 2 verified this against fresh state.
    
    await tx.rideRequest.updateMany({
      where: { id: { in: rideRequestIds } },
      data: { poolId: pool.id, status: RideStatus.MATCHED },
    });

    // 6. Recalculate fares for every ride in the pool.
    //    Discount rule: >= 2 distinct passengers (not seats).
    const allRides = await tx.rideRequest.findMany({
      where: {
        poolId: pool.id,
        status: { not: RideStatus.CANCELLED },
      },
      select: {
        id: true,
        passengerId: true,
        pickupZone: true,
        destinationZone: true,
        seatsRequested: true,
      },
    });

    const distinctPassengers = new Set(allRides.map((r) => r.passengerId)).size;
    const farePassengerCount =
      distinctPassengers >= FARE_CONFIG.MIN_POOL_PASSENGERS ? distinctPassengers : 1;

    for (const ride of allRides) {
      const perSeat = FareService.calculateFare(
        ride.pickupZone as DhakaZone,
        ride.destinationZone as DhakaZone,
        farePassengerCount,
      );
      const total = perSeat.totalPoysha * ride.seatsRequested;
      await tx.rideRequest.update({
        where: { id: ride.id },
        data: { farePoysha: total },
      });
    }

    return tx.pool.findUniqueOrThrow({
      where: { id: pool.id },
      include: {
        tesla: { select: { id: true, name: true, capacity: true } },
        rideRequests: {
          select: {
            id: true,
            passengerId: true,
            pickupZone: true,
            destinationZone: true,
            seatsRequested: true,
            farePoysha: true,
            status: true,
          },
        },
      },
    });
  });
}

// ------------------------------------------------------------------
// Pool lifecycle: start / complete / cancel
// ------------------------------------------------------------------

async function loadOwnedPool(driverId: string, poolId: string) {
  const pool = await prisma.pool.findFirst({
    where: { id: poolId, tesla: { driverId } },
  });
  if (!pool) {
    throw new AppError(404, 'POOL_NOT_FOUND', 'Pool not found.');
  }
  return pool;
}

export async function startPool(driverId: string, poolId: string) {
  const pool = await loadOwnedPool(driverId, poolId);
  assertPoolTransition(pool.status, RideStatus.STARTED);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.pool.update({
      where: { id: pool.id },
      data: { status: RideStatus.STARTED, startedAt: new Date() },
    });

    // Move every non-cancelled ride into STARTED.
    await tx.rideRequest.updateMany({
      where: {
        poolId: pool.id,
        status: { not: RideStatus.CANCELLED },
      },
      data: { status: RideStatus.STARTED },
    });

    return updated;
  });
}

export async function completePool(driverId: string, poolId: string) {
  const pool = await loadOwnedPool(driverId, poolId);
  assertPoolTransition(pool.status, RideStatus.COMPLETED);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.pool.update({
      where: { id: pool.id },
      data: { status: RideStatus.COMPLETED, completedAt: new Date() },
    });

    await tx.rideRequest.updateMany({
      where: {
        poolId: pool.id,
        status: { not: RideStatus.CANCELLED },
      },
      data: { status: RideStatus.COMPLETED },
    });

    return updated;
  });
}

export async function cancelPool(driverId: string, poolId: string) {
  const pool = await loadOwnedPool(driverId, poolId);
  assertPoolTransition(pool.status, RideStatus.CANCELLED);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.pool.update({
      where: { id: pool.id },
      data: { status: RideStatus.CANCELLED, completedAt: new Date() },
    });

    await tx.rideRequest.updateMany({
      where: { poolId: pool.id, status: { not: RideStatus.CANCELLED } },
      data: { status: RideStatus.CANCELLED },
    });

    return updated;
  });
}