import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';

/** Page shell: mist background, safe-area top padding and an optional pull-to-refresh. */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  contentStyle,
  scroll = true,
  header,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  header?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  if (!scroll) {
    return <View style={[styles.root, { paddingTop: insets.top }, contentStyle]}>{children}</View>;
  }
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {header}
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.midnight} colors={[colors.midnight]} /> : undefined}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mist },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
});
