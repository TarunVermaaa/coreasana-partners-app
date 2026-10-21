import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOutDown, LinearTransition, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme/tokens';
import { T } from './T';

type Toast = { id: number; message: string; tone: 'neutral' | 'error' };
const ToastContext = createContext<{ show: (message: string, tone?: Toast['tone']) => void }>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const show = useCallback((message: string, tone: Toast['tone'] = 'neutral') => {
    if (timer.current) clearTimeout(timer.current);
    seq.current += 1;
    setToast({ id: seq.current, message, tone });
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 92 }]}>
        {toast && (
          <Animated.View
            key={toast.id}
            entering={SlideInDown.springify().damping(18)}
            exiting={FadeOutDown.duration(180)}
            layout={LinearTransition}
            accessibilityLiveRegion="polite"
            style={[styles.toast, toast.tone === 'error' && styles.error]}
          >
            <T v="smallStrong" style={styles.text}>
              {toast.message}
            </T>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: {
    backgroundColor: colors.midnight,
    borderRadius: radius.control,
    paddingHorizontal: 16,
    paddingVertical: 11,
    maxWidth: 340,
  },
  error: { backgroundColor: colors.vermilion },
  text: { color: colors.white },
});
