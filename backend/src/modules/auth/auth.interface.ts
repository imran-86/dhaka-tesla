import type { Role } from '../../generated/prisma/enums.js';

export interface ILoginUser {
  email: string;
  password: string;
}

export interface ISignupPassenger {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface ISignupDriver {
  name: string;
  email: string;
  phone?: string;
  password: string;
  vehicle: {
    name: string;
    capacity: number;
  };
}

export interface IPublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
  tesla?: {
    id: string;
    name: string;
    capacity: number;
    status: string;
  } | null;
}

export interface IAuthResult {
  user: IPublicUser;
  accessToken: string;
}