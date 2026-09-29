
export type Role = 'PASSENGER' | 'DRIVER';

export type TeslaStatus = 'ONLINE' | 'OFFLINE';

export type RideStatus =
  | 'REQUESTED'
  | 'MATCHED'
  | 'DRIVER_ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Tesla {
  id: string;
  name: string;
  capacity: number;
  status: TeslaStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
  tesla?: Tesla | null;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  poolId: string | null;
  pickupZone: string;
  destinationZone: string;
  seatsRequested: number;
  farePoysha: number;
  status: RideStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Pool {
  id: string;
  teslaId: string;
  status: RideStatus;
  pickupZone: string;
  corridor: string;
  totalSeatsBooked: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  tesla?: Pick<Tesla, 'id' | 'name' | 'capacity'>;
  rideRequests?: RideRequest[];
}

/**
 * Error shape returned by the backend for any non-2xx response.
 * See backend/src/middlewares/error.ts
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
/** Response of POST /api/rides/estimate — preview only, not persisted. */
export interface FareEstimate {
  distanceKm: number;
  seatsRequested: number;
  soloFarePoysha: number;
  pooledFarePoysha: number;
  savingsPoysha: number;
  discountPercent: number;
}
/** Response of GET /api/tesla/status */
export interface TeslaStatusInfo {
  id: string;
  name: string;
  capacity: number;
  status: TeslaStatus;
  occupiedSeats: number;
  availableSeats: number;
  driver: { id: string; name: string };
}
/** Response of GET /api/driver/status and PATCH /api/driver/status */
export interface DriverTeslaStatus {
  id: string;
  name: string;
  capacity: number;
  status: TeslaStatus;
}

/** A pending ride request as seen by the driver. */
export interface PendingRideRequest {
  id: string;
  passengerId: string;
  pickupZone: string;
  destinationZone: string;
  seatsRequested: number;
  farePoysha: number;
  status: RideStatus;
  createdAt: string;
}

/**
 * A pool as returned by the driver endpoints.
 * Includes the Tesla summary and the attached ride requests.
 */
export interface DriverPool {
  id: string;
  teslaId: string;
  status: RideStatus;
  pickupZone: string;
  corridor: string;
  totalSeatsBooked: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  tesla: { id: string; name: string; capacity: number };
  rideRequests: Array<{
    id: string;
    passengerId: string;
    pickupZone: string;
    destinationZone: string;
    seatsRequested: number;
    farePoysha: number;
    status: RideStatus;
  }>;
}