import { KEYS, storage } from '@/lib/storage';
import type { ApiErrorBody } from './types';

const DEFAULT_API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4100').replace(/\/+$/, '');
const USE_FIXTURES = process.env.EXPO_PUBLIC_USE_FIXTURES === '1';

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

  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (USE_FIXTURES) {
    const { handleFixture } = await import('./fixtures');
    return handleFixture<T>(method, path, body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', `Can't reach the partner server at ${baseUrl}. Check your connection and try again.`);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;
  if (!res.ok) {
    const err = json?.error;
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, err?.code ?? 'INTERNAL', err?.message ?? `Request failed (${res.status})`, err?.details ?? []);
  }
  return json as T;
}
