import { StyleSheet, View } from 'react-native';
import type { Commission } from '@/api/types';
import { itemsLabel, rupees, shortDate } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { StatusPill } from './StatusPill';
import { T } from './T';

/** Compact, non-interactive commission row used on Home. */
export function CommissionLine({ c, last }: { c: Commission; last?: boolean }) {
  const negative = c.amount < 0;
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={{ flex: 1, gap: 4 }}>
        <T v="bodyStrong" numberOfLines={1}>
          {c.kind === 'clawback' ? 'Refund after payout' : itemsLabel(c.order.items)}
        </T>
        <T v="caption">
          {shortDate(c.order.placedAt)}, order {rupees(c.order.total)}
        </T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <T v="number" style={[negative && { color: colors.vermilion }, c.status === 'reversed' && styles.struck]}>
          {negative ? rupees(c.amount) : `+${rupees(c.amount)}`}
        </T>
        <StatusPill commission={c} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  struck: { textDecorationLine: 'line-through', color: colors.slate },
});
