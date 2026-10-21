import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useMe } from '@/api/hooks';
import { initials } from '@/lib/format';
import { colors, fonts } from '@/theme/tokens';
import { PressableScale } from './Button';
import { T } from './T';

/** Screen title on the left, the partner's initials (opens Profile) on the right. */
export function TabHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const { data: me } = useMe();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {subtitle ? <T v="small">{subtitle}</T> : null}
        <T v="title" accessibilityRole="header">
          {title}
        </T>
      </View>
      <PressableScale accessibilityRole="button" accessibilityLabel="Your profile" onPress={() => router.push('/profile')} style={styles.avatar}>
        <T style={styles.initials}>{me ? initials(me.name) : ''}</T>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 14, paddingBottom: 18, gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.midnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.lavender, letterSpacing: 0.5 },
});
