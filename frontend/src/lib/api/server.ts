import 'server-only';
import { cookies } from 'next/headers';

/**
 * Server-side fetch helper.
 *
 * - Prefixes the internal API URL (never exposed to the browser).
 * - Forwards the browser's cookies to the backend so JWT auth works.
 * - Returns parsed JSON or throws with the backend's error shape.
 *
 * Only usable inside Server Components, Server Actions, and Route Handlers.
 */
const API_URL = process.env.API_URL_INTERNAL ?? 'http://localhost:4000';

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export class ServerApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = 'ServerApiError';
  }
}

interface ServerFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { method = 'GET', body } = options;

  // Forward the browser's cookies to the backend.
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const headers: Record<string, string> = {};
  if (cookieHeader) headers.Cookie = cookieHeader;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorBody: ApiErrorBody =
      json && typeof json === 'object' && 'error' in json
        ? (json as { error: ApiErrorBody }).error
        : { code: 'UNKNOWN_ERROR', message: 'Something went wrong' };
    throw new ServerApiError(res.status, errorBody);
  }

  return (json as { data: T }).data;
}