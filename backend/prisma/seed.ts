import bcrypt from 'bcryptjs';
import { Role, RideStatus, TeslaStatus } from '../src/generated/prisma/client.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('🌱 Clearing existing database records...');

  await prisma.payment.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.tesla.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Tesla@123', 10);

  console.log('🚗 Seeding driver Jashim and his Tesla (Bullet)...');
  const jashim = await prisma.user.create({
    data: {
      name: 'Jashim',
      email: 'jashim@dhaka-tesla.local',
      phone: '01710000001',
      passwordHash,
      role: Role.DRIVER,
      tesla: {
        create: {
          name: 'Bullet',
          capacity: 3,
          status: TeslaStatus.ONLINE,
        },
      },
    },
    include: { tesla: true },
  });

  console.log('👥 Seeding passengers: Nusrat, Rafiq, Shirin...');
  const [nusrat, rafiq, shirin] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Nusrat',
        email: 'nusrat@dhaka-tesla.local',
        phone: '01810000001',
        passwordHash,
        role: Role.PASSENGER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Rafiq',
        email: 'rafiq@dhaka-tesla.local',
        phone: '01910000001',
        passwordHash,
        role: Role.PASSENGER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Shirin',
        email: 'shirin@dhaka-tesla.local',
        phone: '01610000001',
        passwordHash,
        role: Role.PASSENGER,
      },
    }),
  ]);

  console.log('📝 Seeding ride requests (Banani → Mohakhali / Gulshan 1 / Farmgate)...');
  // Fare in poysha (integer). See README fare model.
  // baseFare 5000 + distanceCharge 4000 - poolDiscount 0 (not yet pooled)
  await prisma.rideRequest.createMany({
    data: [
      {
        passengerId: nusrat.id,
        pickupZone: 'Banani',
        destinationZone: 'Mohakhali',
        seatsRequested: 1,
        farePoysha: 9000,
        status: RideStatus.REQUESTED,
      },
      {
        passengerId: rafiq.id,
        pickupZone: 'Banani',
        destinationZone: 'Gulshan 1',
        seatsRequested: 1,
        farePoysha: 9000,
        status: RideStatus.REQUESTED,
      },
      {
        passengerId: shirin.id,
        pickupZone: 'Banani',
        destinationZone: 'Farmgate',
        seatsRequested: 1,
        farePoysha: 11000,
        status: RideStatus.REQUESTED,
      },
    ],
  });

  console.log('✅ Seeding complete.');
  console.log({
    driver: { name: jashim.name, tesla: jashim.tesla?.name, capacity: jashim.tesla?.capacity },
    passengers: [nusrat.name, rafiq.name, shirin.name],
    demoPassword: 'Tesla@123',
  });
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });