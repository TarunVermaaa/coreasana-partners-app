import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { colors, fonts } from '@/theme/tokens';
import { T } from './T';

/**
 * A rubber "Paid" stamp, like the one on a passbook entry. It lands with a thud the first time
 * the partner sees a newly paid payout; afterwards it's simply printed there.
 */
export function PaidStamp({ date, animate }: { date: string; animate: boolean }) {
  const reduced = useReducedMotion();
  const play = animate && !reduced;
  const scale = useSharedValue(play ? 2.2 : 1);
  const opacity = useSharedValue(play ? 0 : 1);
  const rotate = useSharedValue(play ? -18 : -9);

  useEffect(() => {
    if (!play) return;
    const land = () => haptic.stamp();
    opacity.value = withDelay(350, withTiming(1, { duration: 120 }));
    rotate.value = withDelay(350, withSpring(-9, { damping: 12, stiffness: 260 }));
    scale.value = withDelay(
      350,
      withSequence(
        withTiming(0.94, { duration: 170 }, (done) => {
          if (done) runOnJS(land)();
        }),
        withSpring(1, { damping: 9, stiffness: 320 }),
      ),
    );
  }, [play, opacity, rotate, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.stamp, style]} accessibilityLabel={`Paid on ${date}`}>
      <View style={styles.inner}>
        <T style={styles.word}>Paid</T>
        <T v="caption" style={styles.date}>
          {date}
        </T>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 2,
    borderColor: colors.leaf,
    borderRadius: 6,
    padding: 2,
    alignSelf: 'flex-start',
    opacity: 0.92,
  },
  inner: { borderWidth: 1, borderColor: colors.leaf, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, alignItems: 'center' },
  word: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.leaf, letterSpacing: 1 },
  date: { color: colors.leaf, fontFamily: fonts.bodySemi },
});
