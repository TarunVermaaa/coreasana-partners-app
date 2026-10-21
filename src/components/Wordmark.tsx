import { StyleSheet, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';
import { Lotus } from './Lotus';
import { T } from './T';

/** "Core Asana Partners" lockup: a lotus node + the name, no logo pastiche. */
export function Wordmark({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const color = tone === 'dark' ? colors.midnight : colors.white;
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Core Asana Partners">
      <Lotus size={18} color={colors.lavenderDeep} center={color} />
      <T style={[styles.name, { color }]}>Core Asana</T>
      <T style={[styles.partners, { color }]}>Partners</T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontFamily: fonts.display, fontSize: 17, lineHeight: 22 },
  partners: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22, opacity: 0.7 },
});
