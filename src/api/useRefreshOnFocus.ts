import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Refetches when the partner comes back to a tab, so a new order or a payout marked paid shows up
 * without pulling to refresh. Skips the first focus: the screen's queries already fetch on mount.
 */
export function useRefreshOnFocus(refetch: () => unknown) {
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );
}
