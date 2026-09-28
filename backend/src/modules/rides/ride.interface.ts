import type { RideStatus } from '../../generated/prisma/enums.js';

export interface ICreateRide {
  pickupZone: string;
  destinationZone: string;
  seatsRequested: number;
}

export interface IListRidesFilter {
  status?: RideStatus;
}