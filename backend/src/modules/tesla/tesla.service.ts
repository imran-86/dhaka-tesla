import { AppError } from '../../common/utils/AppError.js';
import { RideStatus, TeslaStatus } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/prisma.js';


/**
 * Return the currently active Tesla (single-Tesla MVP) with live seat counts.
 *
 * Occupied seats are computed from ride_requests JOIN pools where the pool
 * is in an active state (MATCHED / DRIVER_ARRIVED / STARTED) and the ride
 * itself is not CANCELLED.
 */
export async function getActiveTeslaStatus() {
  const tesla = await prisma.tesla.findFirst({
    select: {
      id: true,
      name: true,
      capacity: true,
      status: true,
      driver: { select: { id: true, name: true } },
    },
  });

  if (!tesla) {
    throw new AppError(404, 'TESLA_NOT_FOUND', 'No Tesla is registered.');
  }

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

  const occupiedSeats = usage._sum.seatsRequested ?? 0;
  const availableSeats = Math.max(0, tesla.capacity - occupiedSeats);

  return {
    id: tesla.id,
    name: tesla.name,
    capacity: tesla.capacity,
    status: tesla.status as TeslaStatus,
    occupiedSeats,
    availableSeats,
    driver: tesla.driver,
  };
}