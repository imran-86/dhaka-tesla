export interface ISetDriverStatus {
  status: 'ONLINE' | 'OFFLINE';
}

export interface IAcceptRequests {
  rideRequestIds: string[];
}