import { apiRequest } from './client';
import type { User } from '@/types';

interface AuthResponse {
  user: User;
}

export interface SignupPassengerInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface SignupDriverInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  vehicle: {
    name: string;
    capacity: number;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: input,
    }),

  signupPassenger: (input: SignupPassengerInput) =>
    apiRequest<AuthResponse>('/api/auth/signup/passenger', {
      method: 'POST',
      body: input,
    }),

  signupDriver: (input: SignupDriverInput) =>
    apiRequest<AuthResponse>('/api/auth/signup/driver', {
      method: 'POST',
      body: input,
    }),

  me: () => apiRequest<AuthResponse>('/api/auth/me'),

  logout: () =>
    apiRequest<void>('/api/auth/logout', { method: 'POST' }),
};