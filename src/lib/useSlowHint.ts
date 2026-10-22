import { useEffect, useState } from 'react';

/** True once `busy` has lasted longer than `afterMs`: time to explain the wait. */
export function useSlowHint(busy: boolean, afterMs = 4_000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!busy) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), afterMs);
    return () => clearTimeout(t);
  }, [busy, afterMs]);
  return slow;
}

export const WAKING_COPY = 'Waking up the server. This can take up to a minute on the free plan.';
