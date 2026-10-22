import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import type { Commission } from '@/api/types';
import { haptic } from '@/lib/haptics';
import { commissionCaption, commissionDate, commissionTitle } from '@/lib/commission';
import { isPast, rupees, shortDate } from '@/lib/format';
import { colors, fonts } from '@/theme/tokens';
import { StatusPill } from './StatusPill';
import { T } from './T';
import { useToast } from './Toast';

type Step = { title: string; detail?: string; date?: string; state: 'done' | 'current' | 'upcoming' | 'stopped'; mono?: string };

const at = (c: Commission, to: Commission['status']) => c.history.find((h) => h.to === to);

/** Turns a commission's status history into the plain-language timeline a partner sees. */
export function timeline(c: Commission, holdDays = 15): Step[] {
  if (c.kind === 'clawback') {
    const created = c.history[0];
    return [
      { title: 'Order refunded after it was paid', detail: created?.note ?? (c.order ? `Order ${c.order.externalId}` : undefined), date: created?.at ?? c.createdAt, state: 'done' },
      c.status === 'paid'
        ? { title: 'Deducted from a payout', detail: c.payout?.number, date: c.payout?.paidAt ?? undefined, state: 'done' }
        : { title: 'Deducted from your next payout', detail: 'Nothing for you to do.', state: 'current' },
    ];
  }

  const steps: Step[] = [
    { title: 'Order placed', detail: c.order ? `Order ${c.order.externalId}, ${rupees(c.order.total)}` : undefined, date: commissionDate(c), state: 'done' },
  ];

  if (c.status === 'reversed') {
    const h = at(c, 'reversed');
    steps.push({ title: 'Order refunded, commission reversed', detail: h?.note, date: h?.at, state: 'stopped' });
    return steps;
  }
  if (c.status === 'rejected') {
    const h = at(c, 'rejected');
    steps.push({ title: 'Not approved', detail: h?.note ?? 'The partner team couldn’t approve this order.', date: h?.at, state: 'stopped' });
    return steps;
  }

  const holdOver = c.status !== 'pending' || isPast(c.holdUntil);
  if (c.status === 'pending' && c.needsReview) {
    steps.push({ title: 'Being checked by the partner team', detail: 'Some orders get a quick manual check before they clear. No action needed.', state: 'current' });
  } else {
    steps.push({
      title: holdOver ? 'Return window ended' : `Return window ends ${shortDate(c.holdUntil)}`,
      detail: holdOver ? undefined : `Orders clear ${holdDays} days after they're placed, once the return period is over.`,
      date: holdOver ? (at(c, 'approved')?.at ?? c.holdUntil) : undefined,
      state: holdOver ? 'done' : 'current',
    });
  }

  const approved = at(c, 'approved');
  steps.push({
    title: 'Ready for payout',
    date: approved?.at,
    detail: approved?.by.type === 'staff' && approved.note ? approved.note : undefined,
    state: ['approved', 'in_payout', 'paid'].includes(c.status) ? (c.status === 'approved' ? 'current' : 'done') : 'upcoming',
  });
  const inPayout = at(c, 'in_payout');
  steps.push({
    title: c.payout ? `In payout ${c.payout.number}` : 'Added to a Friday payout',
    date: inPayout?.at,
    state: c.status === 'in_payout' ? 'current' : c.status === 'paid' ? 'done' : 'upcoming',
  });
  steps.push({
    title: 'Paid',
    date: c.payout?.paidAt ?? at(c, 'paid')?.at,
    mono: c.status === 'paid' && c.payout?.utr ? c.payout.utr : undefined,
    state: c.status === 'paid' ? 'done' : 'upcoming',
  });
  return steps;
}

export function CommissionRow({ c, holdDays, last }: { c: Commission; holdDays: number; last?: boolean }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const negative = c.amount < 0;

  return (
    <Animated.View layout={LinearTransition.springify().damping(22).stiffness(220)} style={[styles.row, !last && styles.divider, open && styles.rowOpen]}>
      <Pressable
        onPress={() => {
          haptic.tap();
          setOpen((o) => !o);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${commissionTitle(c)}, ${rupees(c.amount)}`}
        accessibilityHint="Shows where this commission is"
        style={styles.head}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <T v="bodyStrong" numberOfLines={open ? undefined : 2}>
            {commissionTitle(c)}
          </T>
          <T v="caption">{commissionCaption(c)}</T>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <T v="number" style={[negative && { color: colors.vermilion }, c.status === 'reversed' && styles.struck]}>
            {negative ? rupees(c.amount) : `+${rupees(c.amount)}`}
          </T>
          <StatusPill commission={c} />
        </View>
      </Pressable>

      {open && (
        <Animated.View entering={FadeIn.duration(220).delay(60)} style={styles.body}>
          {c.kind === 'sale' && (
            <T v="caption" style={{ marginBottom: 12 }}>
              {c.ratePct}% of {rupees(c.base)} (the order after your student's discount, without shipping and GST).
            </T>
          )}
          {timeline(c, holdDays).map((s, i, arr) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.dot,
                    s.state === 'done' && styles.dotDone,
                    s.state === 'current' && styles.dotCurrent,
                    s.state === 'stopped' && styles.dotStopped,
                  ]}
                />
                {i < arr.length - 1 && <View style={[styles.line, s.state === 'done' && styles.lineDone]} />}
              </View>
              <View style={styles.stepText}>
                <T v="smallStrong" style={s.state === 'upcoming' && { color: colors.slate, fontFamily: fonts.bodyMedium }}>
                  {s.title}
                </T>
                {s.date ? <T v="caption">{shortDate(s.date)}</T> : null}
                {s.detail ? <T v="caption">{s.detail}</T> : null}
                {s.mono ? (
                  <Pressable
                    onPress={async () => {
                      await Clipboard.setStringAsync(s.mono!);
                      haptic.success();
                      toast.show('UTR copied');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Copy UTR ${s.mono}`}
                  >
                    <T v="mono" style={styles.utr}>
                      UTR {s.mono}
                    </T>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.white, overflow: 'hidden' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowOpen: { backgroundColor: '#FAF8FE' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  body: { paddingHorizontal: 16, paddingBottom: 6, paddingTop: 2 },
  step: { flexDirection: 'row', gap: 12 },
  rail: { width: 14, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.white, marginTop: 4 },
  dotDone: { backgroundColor: colors.midnight, borderColor: colors.midnight },
  dotCurrent: { borderColor: colors.amber, backgroundColor: colors.amberSoft },
  dotStopped: { backgroundColor: colors.vermilion, borderColor: colors.vermilion },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 2 },
  lineDone: { backgroundColor: colors.midnight },
  stepText: { flex: 1, paddingBottom: 14, gap: 2 },
  utr: { marginTop: 4, color: colors.midnight, textDecorationLine: 'underline', textDecorationColor: colors.lavender },
  struck: { textDecorationLine: 'line-through', color: colors.slate },
});
