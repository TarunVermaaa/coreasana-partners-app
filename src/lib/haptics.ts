import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics are a nice-to-have: no-ops on web and on devices without a vibrator.
const run = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
};

export const haptic = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  stamp: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
};
