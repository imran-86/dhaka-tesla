import type { ApiError } from '@/types';

/**
 * Base URL for the backend API.
 * Set via NEXT_PUBLIC_API_URL in .env.local
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Custom error thrown by the API client.
 * Carries the backend's error code so callers can branch on it.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set to true to skip the auto-JSON Content-Type (rarely needed) */
  raw?: boolean;
}

/**
 * Typed fetch wrapper.
 *
 * Responsibilities:
 *   - Prepends the API base URL.
 *   - Sends cookies (`credentials: 'include'`) for JWT auth.
 *   - Serializes/parses JSON.
 *   - Unwraps the `{ data: ... }` envelope on success.
 *   - Throws ApiRequestError on non-2xx with the backend's error shape.
 *
 * Every backend success response is `{ data: T }`.
 * Every backend error response is `{ error: { code, message } }`.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, raw } = options;

  const headers: Record<string, string> = {};
  if (!raw && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include', // send/receive httpOnly cookies
  });

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiError =
      json && typeof json === 'object' && 'error' in json
        ? (json as { error: ApiError }).error
        : { code: 'UNKNOWN_ERROR', message: 'Something went wrong' };

    throw new ApiRequestError(response.status, error);
  }

  // Success envelope: { data: T }
  return (json as { data: T }).data;
}