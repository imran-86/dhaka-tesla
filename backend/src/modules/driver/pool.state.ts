import { AppError } from '../../common/utils/AppError.js';
import { RideStatus } from '../../generated/prisma/enums.js';


/**
 * Pool lifecycle:
 *   MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
 *   MATCHED → CANCELLED
 *   DRIVER_ARRIVED → CANCELLED
 *
 * REQUESTED is never a valid Pool state in this app — a pool exists only
 * after a driver accepts at least one ride request. It appears here only
 * because RideStatus is shared with RideRequest.
 */
const POOL_ALLOWED: Record<RideStatus, readonly RideStatus[]> = {
  [RideStatus.REQUESTED]: [RideStatus.MATCHED, RideStatus.CANCELLED],
  [RideStatus.MATCHED]: [
    RideStatus.DRIVER_ARRIVED,
    RideStatus.STARTED,
    RideStatus.CANCELLED,
  ],
  [RideStatus.DRIVER_ARRIVED]: [RideStatus.STARTED, RideStatus.CANCELLED],
  [RideStatus.STARTED]: [RideStatus.COMPLETED],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: [],
};

export function assertPoolTransition(from: RideStatus, to: RideStatus): void {
  if (!POOL_ALLOWED[from]?.includes(to)) {
    throw new AppError(
      422,
      'INVALID_STATE_TRANSITION',
      `Cannot transition pool from ${from} to ${to}`,
    );
  }
}