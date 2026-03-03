import { apiUrl } from './api';
import { clearSession, getSession } from './authStorage';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getAuthToken(): string {
  const session = getSession();
  return String(session?.token || '').trim();
}

function notifyAuthExpired(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('auth:expired', {
      detail: { message },
    }),
  );
}

function parseResponseBody(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown } = {},
  config: { auth?: boolean; logoutOnUnauthorized?: boolean } = {},
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  const wantsAuth = Boolean(config.auth);
  const logoutOnUnauthorized = config.logoutOnUnauthorized !== false;

  if (wantsAuth) {
    if (!token) {
      throw new ApiError('Please sign in to continue.', 401);
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body = options.body as BodyInit | undefined;
  if (options.body !== undefined && options.body !== null && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(options.body);
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
    body,
  });

  const text = await res.text();
  const data = parseResponseBody(text);

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: string }).error || 'Request failed.')
        : typeof data === 'string' && data.trim()
          ? data
          : 'Request failed.';

    if (wantsAuth && res.status === 401 && logoutOnUnauthorized) {
      clearSession();
      notifyAuthExpired('Your session expired. Please sign in again.');
    }

    throw new ApiError(message, res.status, data);
  }

  return data as T;
}
