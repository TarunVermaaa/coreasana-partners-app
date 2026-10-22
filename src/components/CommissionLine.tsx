import { StyleSheet, View } from 'react-native';
import type { Commission } from '@/api/types';
import { commissionCaption, commissionTitle } from '@/lib/commission';
import { rupees } from '@/lib/format';
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
          {commissionTitle(c)}
        </T>
        <T v="caption">{commissionCaption(c)}</T>
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
