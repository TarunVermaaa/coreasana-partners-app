import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

/**
 * Opens the share sheet. Browsers without the Web Share API (most desktop browsers) get the
 * message copied instead, so the button never silently does nothing.
 */
export async function shareOrCopy(message: string): Promise<'shared' | 'copied' | 'dismissed'> {
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: unknown }) : undefined;
  const canShare = Platform.OS !== 'web' || typeof nav?.share === 'function';
  if (canShare) {
    try {
      await Share.share({ message });
      return 'shared';
    } catch {
      return 'dismissed';
    }
  }
  await Clipboard.setStringAsync(message);
  return 'copied';
}

export const COPIED_INSTEAD = 'Copied. Paste it anywhere.';
