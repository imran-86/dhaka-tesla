-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PASSENGER', 'DRIVER');

-- CreateEnum
CREATE TYPE "TeslaStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TESLAPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teslas" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Bullet',
    "capacity" INTEGER NOT NULL DEFAULT 3,
    "status" "TeslaStatus" NOT NULL DEFAULT 'OFFLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teslas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "teslaId" TEXT NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
    "pickupZone" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "totalSeatsBooked" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_requests" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "poolId" TEXT,
    "pickupZone" TEXT NOT NULL,
    "destinationZone" TEXT NOT NULL,
    "seatsRequested" INTEGER NOT NULL DEFAULT 1,
    "farePoysha" INTEGER NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amountPaisa" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teslas_driverId_key" ON "teslas"("driverId");

-- CreateIndex
CREATE INDEX "pools_teslaId_idx" ON "pools"("teslaId");

-- CreateIndex
CREATE INDEX "pools_status_idx" ON "pools"("status");

-- CreateIndex
CREATE INDEX "ride_requests_passengerId_idx" ON "ride_requests"("passengerId");

-- CreateIndex
CREATE INDEX "ride_requests_status_idx" ON "ride_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_poolId_key" ON "payments"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_passengerId_key" ON "payments"("passengerId");

-- AddForeignKey
ALTER TABLE "teslas" ADD CONSTRAINT "teslas_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_teslaId_fkey" FOREIGN KEY ("teslaId") REFERENCES "teslas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
