import type { Commission } from '@/api/types';
import { itemsLabel, rupees, shortDate } from './format';

/** When the sale happened: the order date, or the commission's own date if the order is missing. */
export const commissionDate = (c: Commission) => c.order?.placedAt ?? c.createdAt;

/**
 * Where a row sits in the month-by-month ledger: sales by when the order was placed, clawbacks by
 * when the refund was recorded (that's when the money comes off the partner's balance).
 */
export const ledgerDate = (c: Commission) => (c.kind === 'clawback' ? c.createdAt : commissionDate(c));

/** What the partner recognises the row by: the products, or "Refund after payout" for a clawback. */
export function commissionTitle(c: Commission) {
  if (c.kind === 'clawback') return 'Refund after payout';
  return c.order ? itemsLabel(c.order.items) : 'Order';
}

/** "21 Oct, order ₹2,690.10" — or just the date when the order details aren't available. */
export function commissionCaption(c: Commission) {
  return c.order ? `${shortDate(c.order.placedAt)}, order ${rupees(c.order.total)}` : shortDate(commissionDate(c));
}
