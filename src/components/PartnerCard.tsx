import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, figures, fonts, radius } from '@/theme/tokens';
import { PressableScale } from './Button';
import { Lotus } from './Lotus';
import { T } from './T';

const NODE = 17;
const GAP_X = 31;
const GAP_Y = 27;
const ORIGIN = { x: 70, y: 86 }; // roughly the centre of the code, where the "pressure" starts

type Node = { x: number; y: number; d: number; o: number };

/** One lotus node that blooms when the ripple's wavefront reaches it. */
function RippleNode({ node, progress }: { node: Node; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const local = progress.value * 1.3 - node.d;
    return {
      opacity: interpolate(local, [0, 0.12], [0, node.o], 'clamp'),
      transform: [{ scale: interpolate(local, [0, 0.07, 0.2], [0.2, 1.3, 1], 'clamp') }],
    };
  });
  return (
    <Animated.View style={[styles.node, { left: node.x, top: node.y }, style]}>
      <Lotus size={NODE} color={colors.lavenderDeep} />
    </Animated.View>
  );
}

export type PartnerCardHandle = { flash: () => void };

type Props = {
  code: string;
  discountPct: number;
  ratePct: number;
  /** Plays the rise + ripple once on mount. */
  animateIn?: boolean;
  onCopy?: () => void;
  onShare?: () => void;
  footer?: string;
};

/**
 * The partner card: the code as a printed card, textured like the AcuTech mat.
 * It's the single expressive element of the app; everything around it stays quiet.
 */
export const PartnerCard = forwardRef<PartnerCardHandle, Props>(function PartnerCard(
  { code, discountPct, ratePct, animateIn = true, onCopy, onShare, footer },
  ref,
) {
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rise = useSharedValue(animateIn && !reduced ? 0 : 1);
  const ripple = useSharedValue(animateIn && !reduced ? 0 : 1);
  const flash = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    flash: () => {
      flash.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 520 }));
    },
  }));

  useEffect(() => {
    if (!animateIn || reduced) return;
    rise.value = withSpring(1, { damping: 16, stiffness: 140 });
    ripple.value = withDelay(220, withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }));
  }, [animateIn, reduced, rise, ripple]);

  const nodes = useMemo<Node[]>(() => {
    if (!size.w) return [];
    const out: Node[] = [];
    const maxD = Math.hypot(size.w, size.h);
    for (let row = 0, y = 10; y < size.h - 6; row++, y += GAP_Y) {
      const offset = row % 2 ? GAP_X / 2 : 0;
      for (let x = 10 + offset; x < size.w - 6; x += GAP_X) {
        // Fade the texture out towards the left so the code and terms always read cleanly.
        const o = Math.min(1, Math.max(0.16, (x / size.w - 0.3) / 0.4));
        out.push({ x, y, d: Math.hypot(x - ORIGIN.x, y - ORIGIN.y) / maxD, o });
      }
    }
    return out;
  }, [size]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{ translateY: interpolate(rise.value, [0, 1], [28, 0]) }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  return (
    <Animated.View style={[styles.card, cardStyle]} onLayout={onLayout}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {nodes.map((n, i) => (
          <RippleNode key={i} node={n} progress={ripple} />
        ))}
      </View>

      <T v="smallStrong" style={styles.label}>
        Your partner code
      </T>
      <View style={styles.codeWrap}>
        <Animated.View style={[styles.flash, flashStyle]} />
        <T style={styles.code} accessibilityLabel={`Partner code ${code.split('').join(' ')}`} adjustsFontSizeToFit numberOfLines={1}>
          {code}
        </T>
      </View>
      <T v="small" style={styles.terms}>
        Students get {discountPct}% off with this code.{'\n'}You earn {ratePct}% of every order.
      </T>

      {(onCopy || onShare) && (
        <View style={styles.actions}>
          {onCopy && (
            <PressableScale accessibilityRole="button" accessibilityLabel="Copy code" onPress={onCopy} style={[styles.action, styles.copy]}>
              <T v="smallStrong">Copy code</T>
            </PressableScale>
          )}
          {onShare && (
            <PressableScale accessibilityRole="button" accessibilityLabel="Share code" onPress={onShare} style={[styles.action, styles.share]}>
              <T v="smallStrong" style={{ color: colors.white }}>
                Share
              </T>
            </PressableScale>
          )}
        </View>
      )}
      {footer ? (
        <T v="caption" style={styles.footer}>
          {footer}
        </T>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.lavender,
    borderRadius: radius.card,
    padding: 22,
    paddingTop: 20,
    overflow: 'hidden',
  },
  node: { position: 'absolute', width: NODE, height: NODE },
  label: { color: colors.midnight, opacity: 0.8 },
  codeWrap: { alignSelf: 'flex-start', marginTop: 6, marginBottom: 8, marginLeft: -6, paddingHorizontal: 6, borderRadius: 6 },
  flash: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.lavenderSoft, borderRadius: 6 },
  code: { fontFamily: fonts.display, fontSize: 50, lineHeight: 60, color: colors.midnight, letterSpacing: 1, ...figures.lining },
  terms: { color: colors.midnight, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  action: { borderRadius: radius.control, paddingHorizontal: 18, height: 44, alignItems: 'center', justifyContent: 'center' },
  copy: { backgroundColor: colors.white },
  share: { backgroundColor: colors.midnight, flexGrow: 1 },
  footer: { color: colors.midnight, opacity: 0.75, marginTop: 12 },
});
