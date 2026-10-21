import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { colors, radius } from '@/theme/tokens';
import { PressableScale } from './Button';
import { T } from './T';

type Option<V extends string> = { value: V; label: string };

/** Single-choice chips. `scroll` lays them out on one horizontally scrolling line (filters). */
export function Chips<V extends string>({
  options,
  value,
  onChange,
  scroll,
  accessibilityLabel,
}: {
  options: Option<V>[];
  value: V | null;
  onChange: (v: V) => void;
  scroll?: boolean;
  accessibilityLabel?: string;
}) {
  const chips = options.map((o) => {
    const active = o.value === value;
    return (
      <PressableScale
        key={o.value}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        onPress={() => {
          if (!active) haptic.select();
          onChange(o.value);
        }}
        style={[styles.chip, active && styles.active]}
      >
        <T v="smallStrong" style={{ color: active ? colors.white : colors.midnight }}>
          {o.label}
        </T>
      </PressableScale>
    );
  });

  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
        {chips}
      </ScrollView>
    );
  }
  return (
    <Animated.View layout={LinearTransition} style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {chips}
    </Animated.View>
  );
}

export function ChipRowSpacer() {
  return <View style={{ width: 16 }} />;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    height: 38,
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.midnight, borderColor: colors.midnight },
});
