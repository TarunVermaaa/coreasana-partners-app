import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, fonts, radius } from '@/theme/tokens';
import { T } from './T';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING = { damping: 18, stiffness: 420, mass: 0.6 };

/** Any pressable that gives a small spring "press" — the app's one consistent touch response. */
export function PressableScale({ style, children, disabled, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduced) scale.value = withSpring(0.97, SPRING);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        rest.onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const v = variants[variant];
  const isDisabled = disabled || loading;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, v.box, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <T v="bodyStrong" style={{ color: v.text, fontFamily: fonts.bodySemi }}>
          {label}
        </T>
      )}
    </PressableScale>
  );
}

const variants: Record<Variant, { box: ViewStyle; text: string }> = {
  primary: { box: { backgroundColor: colors.midnight }, text: colors.white },
  secondary: { box: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }, text: colors.midnight },
  quiet: { box: { backgroundColor: 'transparent' }, text: colors.midnight },
  danger: { box: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.vermilionSoft }, text: colors.vermilion },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.control,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
});
