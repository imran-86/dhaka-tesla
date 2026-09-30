import { describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { Role, TeslaStatus } from '../../src/generated/prisma/enums.js';
import { prisma } from '../../src/lib/prisma.js';
import { createApp } from '../../src/app.js';

const app = createApp();
const PASSWORD = 'Tesla@123';

async function seed() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.user.create({
    data: {
      name: 'Jashim',
      email: 'jashim@test.local',
      phone: '01710000001',
      passwordHash,
      role: Role.DRIVER,
      tesla: { create: { name: 'Bullet', capacity: 3, status: TeslaStatus.ONLINE } },
    },
  });

  await prisma.user.create({
    data: { name: 'Nusrat', email: 'nusrat@test.local', passwordHash, role: Role.PASSENGER },
  });
}

async function login(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
  return res.body.data.accessToken as string;
}

async function createRide(token: string) {
  const res = await request(app)
    .post('/api/rides')
    .set('Authorization', `Bearer ${token}`)
    .send({ pickupZone: 'Banani', destinationZone: 'Mohakhali', seatsRequested: 1 });
  expect(res.status).toBe(201);
  return res.body.data.ride;
}

async function acceptIntoPool(driverToken: string, rideId: string) {
  const res = await request(app)
    .post('/api/driver/pools/accept')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({ rideRequestIds: [rideId] });
  expect(res.status).toBe(201);
  return res.body.data.pool.id as string;
}

describe('Ride state transitions', () => {
  it('cancel REQUESTED ride → 200 CANCELLED', async () => {
    await seed();
    const token = await login('nusrat@test.local');
    const ride = await createRide(token);

    const res = await request(app)
      .post(`/api/rides/${ride.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.ride.status).toBe('CANCELLED');
  });

  it('cancel already-CANCELLED ride → 422 INVALID_STATE_TRANSITION', async () => {
    await seed();
    const token = await login('nusrat@test.local');
    const ride = await createRide(token);

    await request(app)
      .post(`/api/rides/${ride.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(`/api/rides/${ride.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('cancel MATCHED ride → 200 CANCELLED', async () => {
    await seed();
    const nusratToken = await login('nusrat@test.local');
    const jashimToken = await login('jashim@test.local');
    const ride = await createRide(nusratToken);

    await acceptIntoPool(jashimToken, ride.id);

    const res = await request(app)
      .post(`/api/rides/${ride.id}/cancel`)
      .set('Authorization', `Bearer ${nusratToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.ride.status).toBe('CANCELLED');
  });

  it('cannot cancel a COMPLETED ride', async () => {
    await seed();
    const nusratToken = await login('nusrat@test.local');
    const jashimToken = await login('jashim@test.local');
    const ride = await createRide(nusratToken);

    const poolId = await acceptIntoPool(jashimToken, ride.id);
    await request(app)
      .post(`/api/driver/pools/${poolId}/start`)
      .set('Authorization', `Bearer ${jashimToken}`);
    await request(app)
      .post(`/api/driver/pools/${poolId}/complete`)
      .set('Authorization', `Bearer ${jashimToken}`);

    const res = await request(app)
      .post(`/api/rides/${ride.id}/cancel`)
      .set('Authorization', `Bearer ${nusratToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('cannot start a pool twice', async () => {
    await seed();
    const nusratToken = await login('nusrat@test.local');
    const jashimToken = await login('jashim@test.local');
    const ride = await createRide(nusratToken);

    const poolId = await acceptIntoPool(jashimToken, ride.id);

    await request(app)
      .post(`/api/driver/pools/${poolId}/start`)
      .set('Authorization', `Bearer ${jashimToken}`);

    const res = await request(app)
      .post(`/api/driver/pools/${poolId}/start`)
      .set('Authorization', `Bearer ${jashimToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('cannot complete a pool that never started', async () => {
    await seed();
    const nusratToken = await login('nusrat@test.local');
    const jashimToken = await login('jashim@test.local');
    const ride = await createRide(nusratToken);

    const poolId = await acceptIntoPool(jashimToken, ride.id);

    // Pool is MATCHED. Try to complete without starting.
    const res = await request(app)
      .post(`/api/driver/pools/${poolId}/complete`)
      .set('Authorization', `Bearer ${jashimToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });
});