import type { Money } from '@/api/types';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,840 — whole rupees unless the amount has paise. Negative amounts keep the sign in front. */
export function rupees(paise: Money, opts: { exact?: boolean } = {}): string {
  const sign = paise < 0 ? '−' : '';
  const abs = Math.abs(paise);
  const hasPaise = abs % 100 !== 0;
  const value = opts.exact || hasPaise ? inrPaise.format(abs / 100) : inr.format(Math.round(abs / 100));
  return `${sign}₹${value}`;
}

/** Whole rupees, for amounts inside sentences where paise are noise. */
export const rupeesRounded = (paise: Money) => rupees(Math.round(paise / 100) * 100);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Dates come as full ISO timestamps or as IST calendar dates ("2026-10-23"); the latter are read as local days. */
export function toDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : new Date(value);
}

/** "27 Oct" (adds the year when it isn't this year). */
export function shortDate(iso: string, now = new Date()): string {
  const d = toDate(iso);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "Friday 23 Oct" */
export function dayDate(iso: string): string {
  const d = toDate(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function weekdayName(weekday: number): string {
  return DAYS[weekday] ?? 'Friday';
}

export function isPast(iso: string, now = new Date()): boolean {
  return toDate(iso).getTime() <= now.getTime();
}

export function daysUntil(iso: string, now = new Date()): number {
  return Math.ceil((toDate(iso).getTime() - now.getTime()) / 86_400_000);
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** "AcuTech Mat Pro" or "AcuTech Mat Pro and 1 more" */
export function itemsLabel(items: { name: string; qty: number }[]): string {
  if (!items.length) return 'Order';
  const [first, ...rest] = items;
  const firstLabel = first.qty > 1 ? `${first.name} ×${first.qty}` : first.name;
  return rest.length ? `${firstLabel} and ${rest.length} more` : firstLabel;
}

/** "+919810011201" or "9810011201" → "+91 98100 11201" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return local.length === 10 ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : phone;
}
