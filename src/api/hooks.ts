import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  Affiliate,
  CodeAvailability,
  Commission,
  CommissionStatus,
  Payout,
  PayoutMethodInput,
  Program,
  Summary,
} from './types';

export const queryKeys = {
  program: ['program'] as const,
  me: ['me'] as const,
  summary: ['me', 'summary'] as const,
  commissions: (status?: CommissionStatus) => ['me', 'commissions', status ?? 'all'] as const,
  payouts: ['me', 'payouts'] as const,
  code: (code: string) => ['code', code] as const,
};

export function useProgram() {
  return useQuery({ queryKey: queryKeys.program, queryFn: () => api.get<Program>('/program'), staleTime: 10 * 60_000 });
}

export function useSummary() {
  return useQuery({ queryKey: queryKeys.summary, queryFn: () => api.get<Summary>('/me/summary') });
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => api.get<Affiliate>('/me') });
}

export function useCommissions(status?: CommissionStatus) {
  return useInfiniteQuery({
    queryKey: queryKeys.commissions(status),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: '20' });
      if (status) qs.set('status', status);
      if (pageParam) qs.set('cursor', pageParam);
      return api.get<{ items: Commission[]; nextCursor: string | null }>(`/me/commissions?${qs}`);
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function usePayouts() {
  return useQuery({ queryKey: queryKeys.payouts, queryFn: () => api.get<{ items: Payout[] }>('/me/payouts') });
}

export function useCodeAvailability(code: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.code(code),
    queryFn: () => api.get<CodeAvailability>(`/codes/${encodeURIComponent(code)}/availability`),
    enabled: enabled && code.length >= 4,
    staleTime: 30_000,
  });
}

export function useSavePayoutMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayoutMethodInput) => api.put<Affiliate>('/me/payout-method', input),
    onSuccess: (affiliate) => {
      qc.setQueryData(queryKeys.me, affiliate);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
