import { StyleSheet, View } from 'react-native';
import type { Commission, CommissionStatus } from '@/api/types';
import { colors, radius } from '@/theme/tokens';
import { T } from './T';

export const STATUS_LABEL: Record<CommissionStatus, string> = {
  pending: 'On hold',
  approved: 'Ready',
  in_payout: 'In payout',
  paid: 'Paid',
  reversed: 'Reversed',
  rejected: 'Not approved',
};

const TONES: Record<CommissionStatus | 'review', { bg: string; fg: string; border?: string }> = {
  pending: { bg: colors.lavenderSoft, fg: colors.midnight },
  review: { bg: colors.white, fg: '#8A5A12', border: colors.amber },
  approved: { bg: colors.amberSoft, fg: '#7A4E0B' },
  in_payout: { bg: colors.white, fg: colors.midnight, border: colors.midnight },
  paid: { bg: colors.leafSoft, fg: colors.leaf },
  reversed: { bg: colors.vermilionSoft, fg: colors.vermilion },
  rejected: { bg: colors.vermilionSoft, fg: colors.vermilion },
};

export function StatusPill({ commission }: { commission: Pick<Commission, 'status' | 'needsReview'> }) {
  const key = commission.status === 'pending' && commission.needsReview ? 'review' : commission.status;
  const tone = TONES[key];
  const label = key === 'review' ? 'Being checked' : STATUS_LABEL[commission.status];
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border ?? tone.bg }]}>
      <T v="caption" style={{ color: tone.fg, fontFamily: 'RedHatText_600SemiBold' }}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
});
