import type { Program } from '@/api/types';

/** Shown until GET /program answers (or if the server can't be reached), so Welcome never looks empty. */
export const FALLBACK_PROGRAM: Program = {
  commissionRatePct: 12,
  customerDiscountPct: 10,
  holdDays: 15,
  minPayout: 50000,
  payoutWeekday: 5,
  nextPayoutDate: new Date().toISOString(),
  averageOrderValue: 200000,
  tdsRatePct: 2,
  tdsNoPanRatePct: 20,
};

/**
 * Partner earning for one average order. `averageOrderValue` is what students actually paid
 * (already after their discount) over the last 90 days, which is also the commission base.
 */
export function earningPerOrder(p: Program): number {
  // Whole rupees: it's an estimate, paise would be false precision.
  return Math.round((p.averageOrderValue * (p.commissionRatePct / 100)) / 100) * 100;
}

/** Suggest a code from a name: "Priya Nair" → "PRIYA10" (the discount %, which students hear as the deal). */
export function suggestCode(name: string, discountPct = 10): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  const letters = first.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  return letters.length >= 2 ? `${letters}${discountPct}` : '';
}
