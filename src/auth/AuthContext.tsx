import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, api, SLOW_REQUEST_MS } from '@/api/client';
import { queryKeys } from '@/api/hooks';
import type { Affiliate, AuthResponse, SignupInput } from '@/api/types';
import { KEYS, storage } from '@/lib/storage';

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; affiliate: Affiliate | null };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<Affiliate>;
  signup: (input: SignupInput) => Promise<Affiliate>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const logout = useCallback(async () => {
    api.setToken(null);
    await storage.remove(KEYS.token);
    qc.clear();
    setState({ status: 'signedOut' });
  }, [qc]);

  // Restore the session on launch. The profile itself is refetched by the screens that need it.
  useEffect(() => {
    api.setUnauthorizedHandler(() => void logout());
    (async () => {
      try {
        await api.loadSavedBaseUrl();
        const token = await storage.get(KEYS.token);
        if (token) {
          api.setToken(token);
          setState({ status: 'signedIn', affiliate: null });
          return;
        }
      } catch {
        // The keystore can fail to decrypt an old entry (e.g. after a restore). Start fresh rather
        // than leave the splash screen up forever.
        await storage.remove(KEYS.token).catch(() => {});
      }
      setState({ status: 'signedOut' });
    })();
    return () => api.setUnauthorizedHandler(null);
  }, [logout]);

  const start = useCallback(
    async (res: AuthResponse) => {
      api.setToken(res.token);
      await storage.set(KEYS.token, res.token);
      qc.setQueryData(queryKeys.me, res.affiliate);
      setState({ status: 'signedIn', affiliate: res.affiliate });
      return res.affiliate;
    },
    [qc],
  );

  const value = useMemo<AuthContextValue>(() => {
    const login = async (email: string, password: string) =>
      start(await api.post<AuthResponse>('/auth/affiliate/login', { email: email.trim(), password }, { timeoutMs: SLOW_REQUEST_MS }));

    const signup = async (input: SignupInput) => {
      try {
        return start(await api.post<AuthResponse>('/auth/affiliate/signup', input, { timeoutMs: SLOW_REQUEST_MS }));
      } catch (e) {
        // If an earlier attempt timed out on our side but reached the server, the account exists:
        // the retry then clashes on email, phone and code at once. Log in with what was entered.
        const clashes = e instanceof ApiError && e.status === 409 ? new Set(e.details.map((d) => d.field)) : null;
        if (clashes?.has('email') && clashes.has('phone') && clashes.has('code')) {
          try {
            return await login(input.email, input.password);
          } catch {
            /* not their account after all: show the original errors */
          }
        }
        throw e;
      }
    };

    return { state, login, signup, logout };
  }, [state, start, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
