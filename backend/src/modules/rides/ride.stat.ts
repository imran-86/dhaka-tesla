import { AppError } from '../../common/utils/AppError.js';
import { RideStatus } from '../../generated/prisma/enums.js';


/**
 * Allowed transitions for an individual RideRequest.
 *
 * Note: DRIVER_ARRIVED and STARTED belong to the Pool lifecycle, not the
 * individual ride — a passenger is not "started" alone when sharing a Tesla.
 * They are listed here as terminal (empty array) so that any attempt to
 * transition a ride into them is rejected with a clear error.
 */
const ALLOWED: Record<RideStatus, readonly RideStatus[]> = {
  [RideStatus.REQUESTED]: [RideStatus.MATCHED, RideStatus.CANCELLED],
  [RideStatus.MATCHED]: [RideStatus.COMPLETED, RideStatus.CANCELLED],
  [RideStatus.DRIVER_ARRIVED]: [],
  [RideStatus.STARTED]: [],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: [],
};

export function assertTransition(from: RideStatus, to: RideStatus): void {
  if (!ALLOWED[from]?.includes(to)) {
    throw new AppError(
      422,
      'INVALID_STATE_TRANSITION',
      `Cannot transition ride from ${from} to ${to}`,
    );
  }
}

export const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
];