/*
  Warnings:

  - A unique constraint covering the columns `[poolId,passengerId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_passengerId_key";

-- DropIndex
DROP INDEX "payments_poolId_key";

-- CreateIndex
CREATE UNIQUE INDEX "payments_poolId_passengerId_key" ON "payments"("poolId", "passengerId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
