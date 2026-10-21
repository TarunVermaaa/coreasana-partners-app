import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useMe, usePayouts, useProgram, useSummary } from '@/api/hooks';
import type { Affiliate, Payout } from '@/api/types';
import { Button, PressableScale } from '@/components/Button';
import { CountUpMoney, SplitDecimals } from '@/components/CountUp';
import { PaidStamp } from '@/components/PaidStamp';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { T } from '@/components/T';
import { TabHeader } from '@/components/TabHeader';
import { useToast } from '@/components/Toast';
import { dayDate, rupees, shortDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { FALLBACK_PROGRAM } from '@/lib/program';
import { KEYS, storage } from '@/lib/storage';
import { colors, figures, fonts, radius } from '@/theme/tokens';

function MethodPanel({ me, tdsRate, tdsNoPanRate }: { me: Affiliate; tdsRate: number; tdsNoPanRate: number }) {
  const router = useRouter();
  const m = me.payoutMethod;
  if (!m) {
    return (
      <View style={[styles.panel, styles.dashed]}>
        <T v="bodyStrong">Where should we pay you?</T>
        <T v="small" style={{ marginTop: 4, marginBottom: 14 }}>
          Add a UPI ID or bank account. Payouts can't be sent until this is in place.
        </T>
        <Button label="Add payout details" onPress={() => router.push('/payout-method')} />
      </View>
    );
  }
  return (
    <View style={styles.panel}>
      <View style={styles.methodRow}>
        <View style={{ flex: 1 }}>
          <T v="caption">{m.type === 'upi' ? 'Paid by UPI to' : 'Paid by bank transfer to'}</T>
          <T v="bodyStrong" style={{ marginTop: 2 }}>
            {m.type === 'upi' ? m.upiId : `${m.accountName}, account ending ${m.accountNumberLast4}`}
          </T>
          {m.type === 'bank' && <T v="caption">IFSC {m.ifsc}</T>}
        </View>
        <PressableScale accessibilityRole="button" onPress={() => router.push('/payout-method')} style={styles.change} hitSlop={8}>
          <T v="smallStrong">Change</T>
        </PressableScale>
      </View>
      <View style={styles.panRow}>
        {me.panLast4 ? (
          <T v="caption">
            PAN on file, ending {me.panLast4}. TDS is {tdsRate}%.
          </T>
        ) : (
          <T v="caption" style={{ color: '#8A5A12' }}>
            No PAN yet, so TDS is {tdsNoPanRate}% instead of {tdsRate}%. Add it under Change.
          </T>
        )}
      </View>
    </View>
  );
}

function PayoutCard({ payout, stamp }: { payout: Payout; stamp: boolean }) {
  const toast = useToast();
  const item = payout.items[0];
  if (!item) return null;
  return (
    <View style={styles.payout}>
      <View style={styles.payoutHead}>
        <View style={{ flex: 1 }}>
          <T v="caption">{dayDate(payout.scheduledFor)}</T>
          <T style={styles.payoutNet}>
            <SplitDecimals text={rupees(item.net)} v="amount" />
          </T>
          <T v="caption">
            {item.commissionCount} {item.commissionCount === 1 ? 'order' : 'orders'}, payout {payout.number}
          </T>
        </View>
        {item.status === 'paid' && item.paidAt ? (
          <PaidStamp date={shortDate(item.paidAt)} animate={stamp} />
        ) : item.status === 'failed' ? (
          <View style={[styles.state, { borderColor: colors.vermilion }]}>
            <T v="smallStrong" style={{ color: colors.vermilion }}>
              Didn't go through
            </T>
          </View>
        ) : (
          <View style={[styles.state, { borderColor: colors.midnight }]}>
            <T v="smallStrong">Processing</T>
          </View>
        )}
      </View>

      <View style={styles.breakdown}>
        <View style={styles.bRow}>
          <T v="small">Commission</T>
          <T v="number">{rupees(item.gross)}</T>
        </View>
        <View style={styles.bRow}>
          <T v="small">TDS at {item.tdsRatePct}%</T>
          <T v="number">−{rupees(item.tds)}</T>
        </View>
        <View style={[styles.bRow, styles.bTotal]}>
          <T v="smallStrong">Sent to you</T>
          <T v="number">{rupees(item.net)}</T>
        </View>
      </View>

      {item.status === 'failed' && (
        <T v="small" style={{ color: colors.vermilion, marginTop: 10 }}>
          {item.failureReason ?? 'The bank rejected the transfer.'} The amount is back in your balance and goes out with the next payout once your details are fixed.
        </T>
      )}
      {item.utr && (
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(item.utr!);
            haptic.success();
            toast.show('UTR copied');
          }}
          accessibilityRole="button"
          accessibilityLabel={`Copy UTR ${item.utr}`}
          style={styles.utrRow}
        >
          <T v="caption">Bank reference (UTR)</T>
          <T v="mono" style={styles.utr}>
            {item.utr}
          </T>
        </Pressable>
      )}
    </View>
  );
}

/** One line per older payout: date, net, and where it went; tap to copy its UTR. */
function EarlierPayout({ payout, last }: { payout: Payout; last: boolean }) {
  const toast = useToast();
  const item = payout.items[0];
  if (!item) return null;
  const failed = item.status === 'failed';
  return (
    <Pressable
      disabled={!item.utr}
      onPress={async () => {
        if (!item.utr) return;
        await Clipboard.setStringAsync(item.utr);
        haptic.success();
        toast.show('UTR copied');
      }}
      accessibilityRole="button"
      accessibilityLabel={`${dayDate(payout.scheduledFor)}, ${rupees(item.net)}${item.utr ? `, copy UTR ${item.utr}` : ''}`}
      style={[styles.earlierRow, !last && styles.earlierDivider]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <T v="smallStrong">{dayDate(payout.scheduledFor)}</T>
        <T v="caption">
          {failed ? (item.failureReason ?? "Didn't go through") : item.utr ? `UTR ${item.utr}` : payout.number}
        </T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <T v="number" style={failed && { color: colors.vermilion }}>
          {rupees(item.net)}
        </T>
        <T v="caption" style={{ color: failed ? colors.vermilion : item.status === 'paid' ? colors.leaf : colors.slate, fontFamily: fonts.bodySemi }}>
          {failed ? 'Returned to balance' : item.status === 'paid' ? 'Paid' : 'Processing'}
        </T>
      </View>
    </Pressable>
  );
}

export default function Payouts() {
  const me = useMe();
  const summary = useSummary();
  const payouts = usePayouts();
  const program = useProgram().data ?? FALLBACK_PROGRAM;
  const [refreshing, setRefreshing] = useState(false);
  const [stampId, setStampId] = useState<string | null>(null);

  const newestPaid = payouts.data?.items.find((p) => p.items[0]?.status === 'paid');

  // The stamp lands once per paid payout; after that it's simply printed.
  useEffect(() => {
    if (!newestPaid) return;
    storage.get(KEYS.seenPaidStamp).then((seen) => {
      if (seen !== newestPaid.id) {
        setStampId(newestPaid.id);
        storage.set(KEYS.seenPaidStamp, newestPaid.id);
      }
    });
  }, [newestPaid?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([me.refetch(), summary.refetch(), payouts.refetch()]);
    setRefreshing(false);
  };

  const next = summary.data?.nextPayout;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <TabHeader title="Payouts" />

      {me.data ? (
        <MethodPanel me={me.data} tdsRate={program.tdsRatePct} tdsNoPanRate={program.tdsNoPanRatePct} />
      ) : (
        <Skeleton height={110} style={{ borderRadius: radius.panel }} />
      )}

      {next && (
        <View style={styles.next}>
          <T v="smallStrong" style={{ color: colors.lavender }}>
            Next payout, {dayDate(next.date)}
          </T>
          <CountUpMoney value={next.estimatedNet} v="amountXL" style={{ color: colors.white, marginTop: 4 }} />
          <T v="small" style={{ color: colors.lavenderSoft }}>
            {next.eligible
              ? `Estimated, after ${next.tdsRatePct ?? program.tdsRatePct}% TDS. It includes every order whose return window has ended.`
              : next.blockers.length
                ? next.blockers.join(' ')
                : `Payouts start once your ready balance reaches ${rupees(program.minPayout)}.`}
          </T>
        </View>
      )}

      <T v="heading" style={styles.section}>
        Payout history
      </T>
      {payouts.isPending ? (
        <Skeleton height={200} style={{ borderRadius: radius.panel }} />
      ) : payouts.isError ? (
        <View style={[styles.panel]}>
          <T v="small" style={{ marginBottom: 12 }}>
            {payouts.error.message}
          </T>
          <Button label="Try again" variant="secondary" onPress={() => payouts.refetch()} />
        </View>
      ) : payouts.data.items.length === 0 ? (
        <View style={[styles.panel, styles.dashed]}>
          <T v="small">
            Your first payout will appear here. Payouts go out every Friday once you've earned {rupees(program.minPayout)}, with the bank reference so you can match it in your statement.
          </T>
        </View>
      ) : (
        <>
          <PayoutCard payout={payouts.data.items[0]} stamp={payouts.data.items[0].id === stampId} />
          {payouts.data.items.length > 1 && (
            <>
              <T v="smallStrong" style={styles.earlier}>
                Earlier payouts
              </T>
              <View style={styles.ledger}>
                {payouts.data.items.slice(1).map((p, i, arr) => (
                  <EarlierPayout key={p.id} payout={p} last={i === arr.length - 1} />
                ))}
              </View>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, padding: 16 },
  dashed: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  methodRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  change: { borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 7 },
  panRow: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  next: { marginTop: 14, backgroundColor: colors.midnight, borderRadius: radius.panel, padding: 18 },
  section: { marginTop: 28, marginBottom: 12 },
  payout: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 12 },
  payoutHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payoutNet: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.midnight, marginVertical: 2, ...figures.tabular },
  state: { borderWidth: 1.5, borderRadius: radius.control, paddingHorizontal: 10, paddingVertical: 5 },
  breakdown: { marginTop: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: 6 },
  bRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bTotal: { paddingTop: 6, marginTop: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  utrRow: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: 2 },
  utr: { color: colors.midnight },
  earlier: { marginTop: 10, marginBottom: 8 },
  ledger: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  earlierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  earlierDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
});
