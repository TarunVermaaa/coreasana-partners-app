// Mirrors the partners-api contract. Money is always integer paise.
export type Money = number;

export type CommissionStatus = 'pending' | 'approved' | 'in_payout' | 'paid' | 'reversed' | 'rejected';
export type Audience = 'teacher' | 'studio' | 'physio' | 'creator' | 'other';

export type Flag = { code: 'self_referral' | 'high_value' | 'repeat_customer'; message: string };

export type HistoryEntry = {
  at: string;
  from: CommissionStatus | null;
  to: CommissionStatus;
  by: { type: 'system' | 'staff' | 'webhook'; name: string };
  note?: string;
};

export type Program = {
  commissionRatePct: number;
  customerDiscountPct: number;
  holdDays: number;
  minPayout: Money;
  payoutWeekday: number;
  nextPayoutDate: string;
  averageOrderValue: Money;
  tdsRatePct: number;
  tdsNoPanRatePct: number;
};

export type PayoutMethod =
  | { type: 'upi'; upiId: string }
  | { type: 'bank'; accountName: string; accountNumberLast4: string; ifsc: string };

export type Affiliate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  audience: Audience;
  city?: string;
  instagram?: string;
  status: 'active' | 'suspended';
  payoutMethod: PayoutMethod | null;
  panLast4: string | null;
  createdAt: string;
};

export type Commission = {
  id: string;
  kind: 'sale' | 'clawback';
  /** Null if the order record is missing on the server; screens fall back to the commission's own dates. */
  order: {
    id: string;
    externalId: string;
    placedAt: string;
    items: { name: string; qty: number }[];
    total: Money;
    status: 'placed' | 'refunded' | 'partially_refunded';
  } | null;
  base: Money;
  ratePct: number;
  amount: Money;
  status: CommissionStatus;
  holdUntil: string;
  flags: Flag[];
  needsReview: boolean;
  payout: null | { id: string; number: string; status: string; utr?: string | null; paidAt?: string | null };
  review?: { decision: 'approve' | 'reject'; note?: string; by: string | { name: string }; at: string } | null;
  history: HistoryEntry[];
  createdAt: string;
};

export type PayoutItem = {
  id: string;
  affiliate: { id: string; name: string; code: string };
  method: PayoutMethod;
  commissionCount: number;
  gross: Money;
  tdsRatePct: number;
  tds: Money;
  net: Money;
  status: 'pending' | 'paid' | 'failed';
  utr: string | null;
  failureReason: string | null;
  paidAt: string | null;
};

export type Payout = {
  id: string;
  number: string;
  status: 'processing' | 'completed';
  scheduledFor: string;
  createdAt: string;
  createdBy: { name: string };
  completedAt?: string | null;
  totals: { gross: Money; tds: Money; net: Money; items: number; paid: number; failed: number };
  items: PayoutItem[];
};

export type Summary = {
  balances: { onHold: Money; ready: Money; inPayout: Money; paidTotal: Money; reversedTotal: Money };
  /** estimatedNet is after TDS at tdsRatePct (2% with PAN, 20% without). */
  nextPayout: { date: string; estimatedNet: Money; eligible: boolean; blockers: string[]; minPayout?: Money; tdsRatePct?: number };
  stats30d: { clicks: number; orders: number; sales: Money; earned: Money };
  shareUrl: string;
  recent: Commission[];
};

export type CodeAvailability = { code: string; available: boolean; reason?: string; suggestions: string[] };

export type AuthResponse = { token: string; affiliate: Affiliate };

export type SignupInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  audience: Audience;
  code: string;
  city?: string;
  instagram?: string;
};

export type PayoutMethodInput =
  | { type: 'upi'; upiId: string; pan?: string }
  | { type: 'bank'; accountName: string; accountNumber: string; ifsc: string; pan?: string };

export type ApiErrorBody = {
  error: { code: string; message: string; details?: { field: string; message: string }[] };
};
