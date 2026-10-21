/**
 * Typed fixture data matching the partners-api contract. Only used when EXPO_PUBLIC_USE_FIXTURES=1
 * (UI work before the API is running). Safe to delete together with the flag in client.ts.
 */
import { ApiError } from './client';
import type { Affiliate, Commission, CommissionStatus, HistoryEntry, Payout, Program, Summary } from './types';

const DAY = 86_400_000;
const now = Date.now();
const ago = (d: number) => new Date(now - d * DAY).toISOString();
const ahead = (d: number) => new Date(now + d * DAY).toISOString();

function nextFriday() {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  return d.toISOString();
}

const program: Program = {
  commissionRatePct: 12,
  customerDiscountPct: 10,
  holdDays: 15,
  minPayout: 50000,
  payoutWeekday: 5,
  nextPayoutDate: nextFriday(),
  averageOrderValue: 229900,
  tdsRatePct: 2,
  tdsNoPanRatePct: 20,
};

let me: Affiliate = {
  id: 'aff_priya',
  name: 'Priya Nair',
  email: 'priya@partners.demo',
  phone: '9810012345',
  code: 'PRIYA10',
  audience: 'teacher',
  city: 'Gurugram',
  instagram: 'priya.moves',
  status: 'active',
  payoutMethod: { type: 'upi', upiId: 'priyanair@okicici' },
  panLast4: '432K',
  createdAt: ago(58),
};

const sys = { type: 'system' as const, name: 'System' };
const hook = { type: 'webhook' as const, name: 'Store' };

function commission(
  n: number,
  daysAgo: number,
  items: { name: string; qty: number; price: number }[],
  status: CommissionStatus,
  extra: Partial<Commission> = {},
): Commission {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0) * 100;
  const base = Math.round(total * 0.9);
  const amount = Math.round(base * 0.12);
  const placedAt = ago(daysAgo);
  const holdUntil = new Date(new Date(placedAt).getTime() + 15 * DAY).toISOString();
  const history: HistoryEntry[] = [{ at: placedAt, from: null, to: 'pending', by: hook }];
  if (['approved', 'in_payout', 'paid'].includes(status)) history.push({ at: holdUntil, from: 'pending', to: 'approved', by: sys, note: 'Return window ended' });
  if (['in_payout', 'paid'].includes(status)) history.push({ at: ago(Math.max(daysAgo - 17, 1)), from: 'approved', to: 'in_payout', by: { type: 'staff', name: 'Rohan Gupta' } });
  if (status === 'paid') history.push({ at: ago(Math.max(daysAgo - 18, 1)), from: 'in_payout', to: 'paid', by: { type: 'staff', name: 'Rohan Gupta' } });
  if (status === 'reversed') history.push({ at: ago(daysAgo - 4), from: 'pending', to: 'reversed', by: hook, note: 'Order refunded' });
  return {
    id: `com_${n}`,
    kind: 'sale',
    order: { id: `ord_${n}`, externalId: `CA-${10400 + n}`, placedAt, items: items.map(({ name, qty }) => ({ name, qty })), total, status: status === 'reversed' ? 'refunded' : 'placed' },
    base,
    ratePct: 12,
    amount,
    status,
    holdUntil,
    flags: [],
    needsReview: false,
    payout: status === 'paid' ? { id: 'po_42', number: 'PO-2026-W42', status: 'completed', utr: 'AXISN26289914471', paidAt: ago(5) } : status === 'in_payout' ? { id: 'po_43', number: 'PO-2026-W43', status: 'processing' } : null,
    history,
    createdAt: placedAt,
    ...extra,
  };
}

const MAT = { name: 'AcuTech Mat Pro', price: 2989 };
const CUSHION = { name: 'Mod Meditation Cushion', price: 1699 };
const BOLSTER = { name: 'Mini Rectangular Bolster', price: 1499 };
const COTTON = { name: 'Cotton Mat', price: 1799 };

const commissions: Commission[] = [
  commission(91, 1, [{ ...MAT, qty: 1 }], 'pending'),
  commission(90, 3, [{ ...CUSHION, qty: 1 }, { ...BOLSTER, qty: 1 }], 'pending'),
  commission(88, 6, [{ ...COTTON, qty: 1 }], 'pending'),
  commission(85, 9, [{ ...MAT, qty: 2 }], 'reversed'),
  commission(82, 17, [{ ...MAT, qty: 1 }], 'approved'),
  commission(80, 19, [{ ...CUSHION, qty: 2 }], 'approved'),
  commission(77, 22, [{ ...BOLSTER, qty: 1 }, { ...COTTON, qty: 1 }], 'approved'),
  commission(70, 27, [{ ...MAT, qty: 1 }], 'paid'),
  commission(66, 30, [{ ...CUSHION, qty: 1 }], 'paid'),
  commission(61, 33, [{ ...COTTON, qty: 1 }, { ...MAT, qty: 1 }], 'paid'),
  {
    ...commission(55, 36, [{ ...BOLSTER, qty: 1 }], 'approved'),
    id: 'com_claw',
    kind: 'clawback',
    amount: -16189,
    history: [{ at: ago(12), from: null, to: 'approved', by: hook, note: 'Order CA-10455 refunded after payout' }],
  },
];

const payouts: Payout[] = [
  {
    id: 'po_42',
    number: 'PO-2026-W42',
    status: 'completed',
    scheduledFor: ago(5),
    createdAt: ago(6),
    createdBy: { name: 'Rohan Gupta' },
    totals: { gross: 113052, tds: 2261, net: 110791, items: 1, paid: 1, failed: 0 },
    items: [
      {
        id: 'pi_1',
        affiliate: { id: me.id, name: me.name, code: me.code },
        method: { type: 'upi', upiId: 'priyanair@okicici' },
        commissionCount: 3,
        gross: 113052,
        tdsRatePct: 2,
        tds: 2261,
        net: 110791,
        status: 'paid',
        utr: 'AXISN26289914471',
        failureReason: null,
        paidAt: ago(5),
      },
    ],
  },
  {
    id: 'po_38',
    number: 'PO-2026-W38',
    status: 'completed',
    scheduledFor: ago(33),
    createdAt: ago(34),
    createdBy: { name: 'Rohan Gupta' },
    totals: { gross: 64560, tds: 1291, net: 63269, items: 1, paid: 1, failed: 0 },
    items: [
      {
        id: 'pi_0',
        affiliate: { id: me.id, name: me.name, code: me.code },
        method: { type: 'upi', upiId: 'priyanair@okicici' },
        commissionCount: 2,
        gross: 64560,
        tdsRatePct: 2,
        tds: 1291,
        net: 63269,
        status: 'paid',
        utr: 'AXISN26261100392',
        failureReason: null,
        paidAt: ago(33),
      },
    ],
  },
];

const sum = (s: CommissionStatus) => commissions.filter((c) => c.status === s).reduce((t, c) => t + c.amount, 0);

function summary(): Summary {
  const ready = sum('approved');
  return {
    balances: { onHold: sum('pending'), ready, inPayout: sum('in_payout'), paidTotal: 174060, reversedTotal: 64562 },
    nextPayout: {
      date: program.nextPayoutDate,
      estimatedNet: Math.round(ready * 0.98),
      eligible: !!me.payoutMethod && ready >= program.minPayout,
      blockers: me.payoutMethod ? [] : ['Add UPI or bank details'],
    },
    stats30d: { clicks: 146, orders: 18, sales: 3846200, earned: 415390 },
    shareUrl: `http://localhost:4100/r/${me.code}`,
    recent: commissions.slice(0, 5),
  };
}

const TAKEN = new Set(['PRIYA10', 'YOGA', 'ASANA', 'KABIR10', 'CORE']);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function handleFixture<T>(method: string, rawPath: string, body: any): Promise<T> {
  await wait(350);
  const [path, query = ''] = rawPath.split('?');
  const params = new URLSearchParams(query);
  const r = (v: unknown) => v as T;

  if (method === 'GET' && path === '/program') return r(program);
  const avail = path.match(/^\/codes\/([^/]+)\/availability$/);
  if (avail) {
    const code = decodeURIComponent(avail[1]).toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) return r({ code, available: false, reason: 'Use 4–12 letters or numbers.', suggestions: [] });
    const taken = TAKEN.has(code);
    return r({ code, available: !taken, reason: taken ? 'Someone already uses this code.' : undefined, suggestions: taken ? [`${code}YOGA`.slice(0, 12), `${code}21`, `${code}GGN`] : [] });
  }
  if (method === 'POST' && path === '/auth/affiliate/login') {
    if (body?.password !== 'Demo@1234') throw new ApiError(401, 'UNAUTHENTICATED', 'Email or password is incorrect.');
    return r({ token: 'fixture-token', affiliate: me });
  }
  if (method === 'POST' && path === '/auth/affiliate/signup') {
    me = { ...me, id: 'aff_new', name: body.name, email: body.email, phone: body.phone, code: body.code, audience: body.audience, payoutMethod: null, panLast4: null, createdAt: new Date().toISOString() };
    return r({ token: 'fixture-token', affiliate: me });
  }
  if (path === '/me' && method === 'GET') return r(me);
  if (path === '/me' && method === 'PATCH') return r((me = { ...me, ...body }));
  if (path === '/me/payout-method' && method === 'PUT') {
    const pm = body.type === 'upi' ? { type: 'upi', upiId: body.upiId } : { type: 'bank', accountName: body.accountName, accountNumberLast4: String(body.accountNumber).slice(-4), ifsc: body.ifsc };
    me = { ...me, payoutMethod: pm as Affiliate['payoutMethod'], panLast4: body.pan ? String(body.pan).slice(-4) : me.panLast4 };
    return r(me);
  }
  if (path === '/me/summary') return r(summary());
  if (path === '/me/commissions') {
    const status = params.get('status');
    const items = status ? commissions.filter((c) => c.status === status) : commissions;
    return r({ items, nextCursor: null });
  }
  if (path === '/me/payouts') return r({ items: payouts });
  throw new ApiError(404, 'NOT_FOUND', `No fixture for ${method} ${path}`);
}

export const fixtureMeta = { program, ahead };
