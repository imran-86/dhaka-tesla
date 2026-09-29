import 'server-only';
import { serverFetch } from './api/server';
import { ServerApiError } from './api/server';
import type { User } from '@/types';

/**
 * Read the current user from the backend using the browser's cookie.
 * Returns null if not logged in or the session is invalid.
 *
 * Safe to call from Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { user } = await serverFetch<{ user: User }>('/api/auth/me');
    return user;
  } catch (err) {
    if (err instanceof ServerApiError && err.status === 401) {
      return null;
    }
    // Network error — fail closed.
    return null;
  }
}