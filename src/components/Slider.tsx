import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

const THUMB = 30;

/** A stepped slider with a springy thumb. PanResponder keeps it identical on Android and web. */
export function Slider({
  value,
  min,
  max,
  onChange,
  accessibilityLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accessibilityLabel: string;
}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const startX = useRef(0);
  const last = useRef(value);
  const widthRef = useRef(0);

  const toX = (v: number, w = widthRef.current) => ((v - min) / (max - min)) * Math.max(0, w - THUMB);

  useEffect(() => {
    const target = toX(value, width);
    x.value = reduced ? target : withSpring(target, { damping: 20, stiffness: 260 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, width, reduced]);

  const setFromX = (px: number) => {
    const usable = Math.max(1, widthRef.current - THUMB);
    const clamped = Math.min(usable, Math.max(0, px));
    const v = Math.round(min + (clamped / usable) * (max - min));
    if (v !== last.current) {
      last.current = v;
      haptic.select();
      onChange(v);
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          startX.current = e.nativeEvent.locationX - THUMB / 2;
          setFromX(startX.current);
        },
        onPanResponderMove: (_e, g) => setFromX(startX.current + g.dx),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, onChange],
  );

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.value + THUMB / 2 }));

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      {...responder.panHandlers}
      onLayout={onLayout}
      style={styles.hit}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + 1));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, value - 1));
      }}
    >
      <View pointerEvents="none" style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.thumb, thumbStyle]}>
        <View style={styles.thumbDot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.lavenderSoft, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.midnight },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.midnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lavenderDeep },
});
