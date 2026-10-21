import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/api/client';
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
      await api.loadSavedBaseUrl();
      const token = await storage.get(KEYS.token);
      if (token) {
        api.setToken(token);
        setState({ status: 'signedIn', affiliate: null });
      } else {
        setState({ status: 'signedOut' });
      }
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

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login: async (email, password) => start(await api.post<AuthResponse>('/auth/affiliate/login', { email: email.trim(), password })),
      signup: async (input) => start(await api.post<AuthResponse>('/auth/affiliate/signup', input)),
      logout,
    }),
    [state, start, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
