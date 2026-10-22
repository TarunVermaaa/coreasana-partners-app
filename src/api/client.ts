import { KEYS, storage } from '@/lib/storage';
import type { ApiErrorBody } from './types';

const DEFAULT_API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4100').replace(/\/+$/, '');
const USE_FIXTURES = process.env.EXPO_PUBLIC_USE_FIXTURES === '1';

/** Login and signup may hit a server that's waking up (Render's free plan sleeps after 15 idle minutes). */
export const SLOW_REQUEST_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 15_000;

type RequestOptions = { timeoutMs?: number };

let baseUrl = DEFAULT_API_URL;
let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
  /** Field-level message from a 400 response, e.g. fieldError('email'). */
  fieldError(field: string) {
    return this.details.find((d) => d.field === field)?.message;
  }
}

export const api = {
  get baseUrl() {
    return baseUrl;
  },
  get defaultBaseUrl() {
    return DEFAULT_API_URL;
  },
  get usingFixtures() {
    return USE_FIXTURES;
  },
  setToken(next: string | null) {
    token = next;
  },
  setUnauthorizedHandler(fn: (() => void) | null) {
    onUnauthorized = fn;
  },
  /** The base URL can be changed in-app (long-press the wordmark on Welcome) so one APK can point at any server. */
  async loadSavedBaseUrl() {
    const saved = await storage.get(KEYS.apiUrl);
    if (saved) baseUrl = saved;
  },
  async setBaseUrl(url: string | null) {
    if (!url || url.replace(/\/+$/, '') === DEFAULT_API_URL) {
      baseUrl = DEFAULT_API_URL;
      await storage.remove(KEYS.apiUrl);
      return;
    }
    baseUrl = url.trim().replace(/\/+$/, '');
    await storage.set(KEYS.apiUrl, baseUrl);
  },

  /** Fire-and-forget request that starts a sleeping server while the partner reads or types. */
  wake() {
    if (USE_FIXTURES) return;
    fetch(`${baseUrl}/api/v1/health`).catch(() => {});
  },

  /** True if `url` answers like this API: JSON {"status":"ok"} from /api/v1/health within 8 seconds. */
  async isPartnerApi(url: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const res = await fetch(`${url.replace(/\/+$/, '')}/api/v1/health`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      const body = (await res.json().catch(() => null)) as { status?: string } | null;
      return res.ok && body?.status === 'ok';
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  },

  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, body, opts),
};

async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  if (USE_FIXTURES) {
    const { handleFixture } = await import('./fixtures');
    return handleFixture<T>(method, path, body);
  }

  // Remember which session sent this request: a slow 401 must not sign out a newer session.
  const sentToken = token;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(sentToken ? { Authorization: `Bearer ${sentToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw timedOut
      ? new ApiError(0, 'TIMEOUT', `The partner server didn't answer in time. It may still be waking up, so try again in a moment.`)
      : new ApiError(0, 'NETWORK', `Can't reach the partner server at ${baseUrl}. Check your connection and try again.`);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text().catch(() => '');
  let json: (T & Partial<ApiErrorBody>) | null = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok) {
    const err = json?.error;
    // 401, or 404 on the partner's own record (e.g. the account no longer exists): this session is
    // over. Sign out, so the app can never be stuck showing a profile that won't load.
    const sessionGone = res.status === 401 || (res.status === 404 && path.startsWith('/me'));
    if (sessionGone && sentToken && sentToken === token) onUnauthorized?.();
    // Server faults never surface raw internals to partners.
    const message = res.status >= 500 ? 'The partner server ran into a problem. Please try again in a minute.' : (err?.message ?? `Request failed (${res.status})`);
    throw new ApiError(res.status, err?.code ?? 'INTERNAL', message, err?.details ?? []);
  }
  // A 2xx that isn't JSON means the address points at something other than the partner API.
  if (text && json === null) {
    throw new ApiError(res.status, 'BAD_RESPONSE', `The server at ${baseUrl} didn't answer like the partner API. Check the server address in your profile.`);
  }
  return json as T;
}
