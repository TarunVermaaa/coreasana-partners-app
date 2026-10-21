import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { colors, fonts, radius } from '@/theme/tokens';
import { T } from './T';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Text-only tabs with a lavender indicator that slides to the active tab. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const tabW = width / Math.max(1, count);
  const x = useSharedValue(0);

  useEffect(() => {
    const target = state.index * tabW;
    x.value = reduced || !tabW ? target : withSpring(target, { damping: 20, stiffness: 240, mass: 0.7 });
  }, [state.index, tabW, reduced, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {tabW > 0 && (
          <Animated.View style={[styles.indicatorWrap, { width: tabW }, indicator]} pointerEvents="none">
            <View style={styles.indicator} />
          </Animated.View>
        )}
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              haptic.select();
              navigateToTab(route.key);
            }
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={styles.tab}
            >
              <T style={[styles.label, focused && styles.labelActive]}>{label}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  row: { flexDirection: 'row', height: 44 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicatorWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, paddingHorizontal: 6 },
  indicator: { flex: 1, backgroundColor: colors.lavenderSoft, borderRadius: radius.control },
  label: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.slate },
  labelActive: { fontFamily: fonts.bodyBold, color: colors.midnight },
});
