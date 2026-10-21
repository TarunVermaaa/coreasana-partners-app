import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { rupees } from '@/lib/format';
import { type as typeScale, type TypeVariant } from '@/theme/tokens';
import { T } from './T';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** "₹645.62" → "₹645" with ".62" set smaller, like a printed receipt; keeps big amounts calm. */
export function SplitDecimals({ text, v }: { text: string; v: TypeVariant }) {
  const dot = text.lastIndexOf('.');
  if (dot === -1) return <>{text}</>;
  const size = (typeScale[v] as { fontSize?: number }).fontSize ?? 16;
  return (
    <>
      {text.slice(0, dot)}
      <Text style={[styles.decimals, { fontSize: Math.round(size * 0.58) }]}>{text.slice(dot)}</Text>
    </>
  );
}

/**
 * Counts a number up to its value. Used once per screen load for balances, so the eye lands on money;
 * later changes (e.g. after pull-to-refresh) animate from the previous value.
 */
export function CountUp({
  value,
  format,
  duration = 900,
  delay = 0,
  v = 'amount',
  smallDecimals = false,
  ...rest
}: { value: number; format: (n: number) => string; duration?: number; delay?: number; v?: TypeVariant; smallDecimals?: boolean } & TextProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      from.current = value;
      return;
    }
    let frame = 0;
    let start = 0;
    const startValue = from.current;
    const timeout = setTimeout(() => {
      const tick = (t: number) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / duration);
        setShown(startValue + (value - startValue) * easeOutCubic(p));
        if (p < 1) frame = requestAnimationFrame(tick);
        else from.current = value;
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, duration, delay, reduced]);

  const text = format(Math.round(shown));
  return (
    <T v={v} {...rest} accessibilityLabel={format(value)}>
      {smallDecimals ? <SplitDecimals text={text} v={v} /> : text}
    </T>
  );
}

/** Money in paise: whole rupees while counting, exact (paise set smaller) once it lands. */
export function CountUpMoney({ value, ...rest }: Omit<Parameters<typeof CountUp>[0], 'format'>) {
  return <CountUp value={value} smallDecimals format={(n) => (n === value ? rupees(value) : rupees(Math.round(n / 100) * 100))} {...rest} />;
}

const styles = StyleSheet.create({
  decimals: { opacity: 0.7 },
});
