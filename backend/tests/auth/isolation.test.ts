import { describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { Role, TeslaStatus, RideStatus } from '../../src/generated/prisma/enums.js';
import { prisma } from '../../src/lib/prisma.js';
import { createApp } from '../../src/app.js';

const app = createApp();
const PASSWORD = 'Tesla@123';

async function seed() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

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
      data: { name: 'Nusrat', email: 'nusrat@test.local', passwordHash, role: Role.PASSENGER },
    }),
    prisma.user.create({
      data: { name: 'Rafiq', email: 'rafiq@test.local', passwordHash, role: Role.PASSENGER },
    }),
    prisma.user.create({
      data: { name: 'Shirin', email: 'shirin@test.local', passwordHash, role: Role.PASSENGER },
    }),
  ]);

  return { jashim, nusrat, rafiq, shirin };
}

async function login(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken as string;
}

async function createRideFor(passengerId: string) {
  return prisma.rideRequest.create({
    data: {
      passengerId,
      pickupZone: 'Banani',
      destinationZone: 'Mohakhali',
      seatsRequested: 1,
      farePoysha: 7500,
      status: RideStatus.REQUESTED,
    },
  });
}

describe('Auth isolation', () => {
  it("Nusrat cannot read Rafiq's ride by id", async () => {
    const { rafiq } = await seed();
    const rafiqRide = await createRideFor(rafiq.id);
    const nusratToken = await login('nusrat@test.local');

    const res = await request(app)
      .get(`/api/rides/${rafiqRide.id}`)
      .set('Authorization', `Bearer ${nusratToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RIDE_NOT_FOUND');
  });

  it("Nusrat cannot cancel Rafiq's ride", async () => {
    const { rafiq } = await seed();
    const rafiqRide = await createRideFor(rafiq.id);
    const nusratToken = await login('nusrat@test.local');

    const res = await request(app)
      .post(`/api/rides/${rafiqRide.id}/cancel`)
      .set('Authorization', `Bearer ${nusratToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RIDE_NOT_FOUND');

    // Verify Rafiq's ride was not touched.
    const after = await prisma.rideRequest.findUniqueOrThrow({ where: { id: rafiqRide.id } });
    expect(after.status).toBe(RideStatus.REQUESTED);
  });

  it('Passenger cannot access a driver-only endpoint', async () => {
    await seed();
    const nusratToken = await login('nusrat@test.local');

    const res = await request(app)
      .get('/api/driver/pools')
      .set('Authorization', `Bearer ${nusratToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Driver cannot access a passenger-only endpoint', async () => {
    await seed();
    const jashimToken = await login('jashim@test.local');

    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${jashimToken}`)
      .send({ pickupZone: 'Banani', destinationZone: 'Mohakhali', seatsRequested: 1 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Unauthenticated request cannot access a protected endpoint', async () => {
    await seed();

    const res = await request(app).get('/api/rides/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NOT_AUTHENTICATED');
  });

  it("A second driver cannot start another driver's pool", async () => {
    const { nusrat } = await seed();
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    await prisma.user.create({
      data: {
        name: 'Karim',
        email: 'karim@test.local',
        passwordHash,
        role: Role.DRIVER,
        tesla: { create: { name: 'Bullet-2', capacity: 3, status: TeslaStatus.ONLINE } },
      },
    });

    const nusratRide = await createRideFor(nusrat.id);

    const jashimToken = await login('jashim@test.local');
    const acceptRes = await request(app)
      .post('/api/driver/pools/accept')
      .set('Authorization', `Bearer ${jashimToken}`)
      .send({ rideRequestIds: [nusratRide.id] });
    expect(acceptRes.status).toBe(201);
    const poolId = acceptRes.body.data.pool.id as string;

    const karimToken = await login('karim@test.local');
    const res = await request(app)
      .post(`/api/driver/pools/${poolId}/start`)
      .set('Authorization', `Bearer ${karimToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('POOL_NOT_FOUND');
  });
});