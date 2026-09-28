import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

beforeEach(async () => {
  // Order matters: respect FK constraints.
  await prisma.payment.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.tesla.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});