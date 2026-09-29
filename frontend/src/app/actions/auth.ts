'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverFetch, ServerApiError } from '@/lib/api/server';
import type { Role, User } from '@/types';

const AUTH_COOKIE = 'accessToken';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ------------------------------------------------------------------
// State shapes for useActionState
// ------------------------------------------------------------------

export interface LoginState {
  error?: string;
}

export interface SignupState {
  error?: string;
}

// ------------------------------------------------------------------
// Internal: set cookie, redirect by role
// ------------------------------------------------------------------

async function persistSessionAndRedirect(accessToken: string, role: Role) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  // redirect() throws internally — must be outside try/catch.
  if (role === 'PASSENGER') redirect('/passenger');
  if (role === 'DRIVER') redirect('/driver');
  redirect('/');
}

// ------------------------------------------------------------------
// Login
// ------------------------------------------------------------------

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  let data: { user: User; accessToken: string };
  try {
    data = await serverFetch<{ user: User; accessToken: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password } },
    );
  } catch (err) {
    if (err instanceof ServerApiError) {
      // Backend already returns generic "Invalid email or password".
      return { error: err.body.message };
    }
    return { error: 'Network error. Please try again.' };
  }

  await persistSessionAndRedirect(data.accessToken, data.user.role);
  return {}; // unreachable — redirect() throws
}

// ------------------------------------------------------------------
// Signup — passenger
// ------------------------------------------------------------------

export async function signupPassengerAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!name || !email || !password) {
    return { error: 'Name, email and password are required.' };
  }

  let data: { user: User; accessToken: string };
  try {
    data = await serverFetch<{ user: User; accessToken: string }>(
      '/api/auth/signup/passenger',
      {
        method: 'POST',
        body: { name, email, phone: phone || undefined, password },
      },
    );
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Network error. Please try again.' };
  }

  await persistSessionAndRedirect(data.accessToken, data.user.role);
  return {};
}

// ------------------------------------------------------------------
// Signup — driver
// ------------------------------------------------------------------

export async function signupDriverAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const vehicleName = String(formData.get('vehicleName') ?? '').trim();
  const capacityRaw = String(formData.get('capacity') ?? '');
  const capacity = Number.parseInt(capacityRaw, 10);

  if (!name || !email || !password) {
    return { error: 'Name, email and password are required.' };
  }
  if (!vehicleName) {
    return { error: 'Vehicle name is required.' };
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 6) {
    return { error: 'Capacity must be a whole number between 1 and 6.' };
  }

  let data: { user: User; accessToken: string };
  try {
    data = await serverFetch<{ user: User; accessToken: string }>(
      '/api/auth/signup/driver',
      {
        method: 'POST',
        body: {
          name,
          email,
          phone: phone || undefined,
          password,
          vehicle: { name: vehicleName, capacity },
        },
      },
    );
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Network error. Please try again.' };
  }

  await persistSessionAndRedirect(data.accessToken, data.user.role);
  return {};
}

// ------------------------------------------------------------------
// Logout
// ------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect('/');
}
export async function signupAction(
  prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const role = String(formData.get('role') ?? 'PASSENGER').toUpperCase();
  if (role === 'DRIVER') return signupDriverAction(prev, formData);
  return signupPassengerAction(prev, formData);
}