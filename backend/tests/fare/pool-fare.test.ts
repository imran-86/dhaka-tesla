import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { Role, TeslaStatus, RideStatus } from '../../src/generated/prisma/enums.js';
import { prisma } from '../../src/lib/prisma.js';
import { acceptRideRequests } from '../../src/modules/driver/driver.service.js';
import { FareService } from '../../src/common/services/fair.services.js';


describe('Fare calculation and pool recalculation', () => {
  it('solo fare for Banani → Mohakhali is 7500 poysha', () => {
    const f = FareService.calculateFare('Banani', 'Mohakhali', 1);
    expect(f.totalPoysha).toBe(7500);
  });

  it('solo fare for Banani → Gulshan 1 is 6750 poysha', () => {
    const f = FareService.calculateFare('Banani', 'Gulshan 1', 1);
    expect(f.totalPoysha).toBe(6750);
  });

  it('pooled fare (2 passengers) applies 20% discount', () => {
    const n = FareService.calculateFare('Banani', 'Mohakhali', 2);
    const r = FareService.calculateFare('Banani', 'Gulshan 1', 2);
    expect(n.totalPoysha).toBe(6000);
    expect(r.totalPoysha).toBe(5400);
  });

  it('recalculates both passengers when a pool forms', async () => {
    const passwordHash = await bcrypt.hash('Tesla@123', 10);
    const jashim = await prisma.user.create({
      data: {
        name: 'Jashim',
        email: 'jashim@test.local',
        passwordHash,
        role: Role.DRIVER,
        tesla: {
          create: { name: 'Bullet', capacity: 3, status: TeslaStatus.ONLINE },
        },
      },
    });
    const nusrat = await prisma.user.create({
      data: {
        name: 'Nusrat',
        email: 'nusrat@test.local',
        passwordHash,
        role: Role.PASSENGER,
      },
    });
    const rafiq = await prisma.user.create({
      data: {
        name: 'Rafiq',
        email: 'rafiq@test.local',
        passwordHash,
        role: Role.PASSENGER,
      },
    });

    const nusratRide = await prisma.rideRequest.create({
      data: {
        passengerId: nusrat.id,
        pickupZone: 'Banani',
        destinationZone: 'Mohakhali',
        seatsRequested: 1,
        farePoysha: 7500,
        status: RideStatus.REQUESTED,
      },
    });
    const rafiqRide = await prisma.rideRequest.create({
      data: {
        passengerId: rafiq.id,
        pickupZone: 'Banani',
        destinationZone: 'Gulshan 1',
        seatsRequested: 1,
        farePoysha: 6750,
        status: RideStatus.REQUESTED,
      },
    });

    await acceptRideRequests(jashim.id, {
      rideRequestIds: [nusratRide.id, rafiqRide.id],
    });

    const nAfter = await prisma.rideRequest.findUniqueOrThrow({
      where: { id: nusratRide.id },
    });
    const rAfter = await prisma.rideRequest.findUniqueOrThrow({
      where: { id: rafiqRide.id },
    });

    expect(nAfter.farePoysha).toBe(6000);
    expect(rAfter.farePoysha).toBe(5400);
  });
});