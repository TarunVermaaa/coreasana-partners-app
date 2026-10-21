import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, radius } from '@/theme/tokens';

/** A soft breathing placeholder block (no shimmer sweep — calmer, and it matches the brand). */
export function Skeleton({ width = '100%', height = 16, style, round }: { width?: DimensionValue; height?: number; style?: StyleProp<ViewStyle>; round?: boolean }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(0.55);
  useEffect(() => {
    if (!reduced) o.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [o, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: round ? height / 2 : radius.control - 2, backgroundColor: colors.lavenderSoft }, animated, style]}
    />
  );
}
