import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { Role, TeslaStatus, RideStatus } from '../../src/generated/prisma/enums.js';
import { prisma } from '../../src/lib/prisma.js';
import { acceptRideRequests } from '../../src/modules/driver/driver.service.js';

/**
 * Helper: seed a driver (Jashim) with a 3-seat Tesla (Bullet), plus three
 * passengers. Each test builds the scenario it needs from this baseline.
 */
async function seedCast() {
  const passwordHash = await bcrypt.hash('Tesla@123', 10);

  const jashim = await prisma.user.create({
    data: {
      name: 'Jashim',
      email: 'jashim@test.local',
      phone: '01710000001',
      passwordHash,
      role: Role.DRIVER,
      tesla: {
        create: { name: 'Bullet', capacity: 3, status: TeslaStatus.ONLINE },
      },
    },
  });

  const [nusrat, rafiq, shirin] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Nusrat',
        email: 'nusrat@test.local',
        passwordHash,
        role: Role.PASSENGER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Rafiq',
        email: 'rafiq@test.local',
        passwordHash,
        role: Role.PASSENGER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Shirin',
        email: 'shirin@test.local',
        passwordHash,
        role: Role.PASSENGER,
      },
    }),
  ]);

  return { jashim, nusrat, rafiq, shirin };
}

async function createRequest(
  passengerId: string,
  pickupZone = 'Banani',
  destinationZone = 'Mohakhali',
  seats = 1,
) {
  return prisma.rideRequest.create({
    data: {
      passengerId,
      pickupZone,
      destinationZone,
      seatsRequested: seats,
      farePoysha: 7500 * seats,
      status: RideStatus.REQUESTED,
    },
  });
}

describe('Last-seat race on Bullet (capacity 3)', () => {
  it('exactly one of two concurrent accepts succeeds when only 1 seat remains', async () => {
    const { jashim, rafiq, nusrat, shirin } = await seedCast();

    // Rafiq takes 2 seats — Bullet now has 1 seat left.
    const rafiqRide = await createRequest(rafiq.id, 'Banani', 'Gulshan 1', 2);
    await acceptRideRequests(jashim.id, { rideRequestIds: [rafiqRide.id] });

    // Nusrat and Shirin each request 1 seat.
    const nusratRide = await createRequest(nusrat.id, 'Banani', 'Mohakhali', 1);
    const shirinRide = await createRequest(shirin.id, 'Banani', 'Mohakhali', 1);

    // Fire both accepts at the same time.
    const results = await Promise.allSettled([
      acceptRideRequests(jashim.id, { rideRequestIds: [nusratRide.id] }),
      acceptRideRequests(jashim.id, { rideRequestIds: [shirinRide.id] }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const error = (rejected[0] as PromiseRejectedResult).reason;
    expect(error.code).toBe('POOL_CAPACITY_EXCEEDED');
  });

  it('never exceeds Tesla capacity under concurrent load', async () => {
    const { jashim, rafiq, nusrat, shirin } = await seedCast();

    const rafiqRide = await createRequest(rafiq.id, 'Banani', 'Gulshan 1', 2);
    await acceptRideRequests(jashim.id, { rideRequestIds: [rafiqRide.id] });

    const nusratRide = await createRequest(nusrat.id, 'Banani', 'Mohakhali', 1);
    const shirinRide = await createRequest(shirin.id, 'Banani', 'Mohakhali', 1);

    await Promise.allSettled([
      acceptRideRequests(jashim.id, { rideRequestIds: [nusratRide.id] }),
      acceptRideRequests(jashim.id, { rideRequestIds: [shirinRide.id] }),
    ]);

    const tesla = await prisma.tesla.findFirstOrThrow({ where: { driverId: jashim.id } });

    const usage = await prisma.rideRequest.aggregate({
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

    expect(usage._sum.seatsRequested ?? 0).toBeLessThanOrEqual(tesla.capacity);
  });

  it('rejects a single accept that would exceed capacity', async () => {
    const { jashim, rafiq, nusrat } = await seedCast();

    // Rafiq takes 3 seats — Bullet is now full.
    const rafiqRide = await createRequest(rafiq.id, 'Banani', 'Gulshan 1', 3);
    await acceptRideRequests(jashim.id, { rideRequestIds: [rafiqRide.id] });

    // Nusrat requests 1 seat — must fail cleanly, no partial state.
    const nusratRide = await createRequest(nusrat.id, 'Banani', 'Mohakhali', 1);

    await expect(
      acceptRideRequests(jashim.id, { rideRequestIds: [nusratRide.id] }),
    ).rejects.toMatchObject({ code: 'POOL_CAPACITY_EXCEEDED' });

    // Nusrat's ride must still be REQUESTED (transaction rolled back).
    const still = await prisma.rideRequest.findUniqueOrThrow({
      where: { id: nusratRide.id },
    });
    expect(still.status).toBe(RideStatus.REQUESTED);
    expect(still.poolId).toBeNull();
  });
});