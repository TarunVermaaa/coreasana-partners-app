import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';
import { T } from './T';

/** Minimal top bar for pushed screens: a back chevron and an optional right-side note. */
export function BackBar({ right, onBack }: { right?: string; onBack?: () => void }) {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/welcome')))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={12}
        style={styles.back}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M15 5l-7 7 7 7" stroke={colors.midnight} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
      {right ? <T v="caption">{right}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, marginLeft: -8, alignItems: 'center', justifyContent: 'center' },
});
