import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useMe, useProgram, useSummary } from '@/api/hooks';
import type { Affiliate, Summary } from '@/api/types';
import { Button, PressableScale } from '@/components/Button';
import { CommissionLine } from '@/components/CommissionLine';
import { CountUpMoney } from '@/components/CountUp';
import { PartnerCard, type PartnerCardHandle } from '@/components/PartnerCard';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { T } from '@/components/T';
import { TabHeader } from '@/components/TabHeader';
import { useToast } from '@/components/Toast';
import { dayDate, firstName, greeting, rupees, rupeesRounded, toDate, weekdayName } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { FALLBACK_PROGRAM } from '@/lib/program';
import { colors, radius } from '@/theme/tokens';

// The card's rise-and-ripple is a once-per-session moment, not something to replay on every refresh.
let introPlayed = false;

function methodLabel(me: Affiliate) {
  const m = me.payoutMethod;
  if (!m) return null;
  return m.type === 'upi' ? `UPI ${m.upiId}` : `bank account ending ${m.accountNumberLast4}`;
}

function readyNote(summary: Summary, me: Affiliate, program: { minPayout: number; tdsRatePct: number; tdsNoPanRatePct: number }) {
  const { nextPayout, balances } = summary;
  const when = dayDate(nextPayout.date);
  const tds = nextPayout.tdsRatePct ?? (me.panLast4 ? program.tdsRatePct : program.tdsNoPanRatePct);
  const minPayout = nextPayout.minPayout ?? program.minPayout;
  if (balances.ready <= 0) return 'Nothing has cleared the return window yet.';
  if (!me.payoutMethod) return `After ${tds}% TDS. Add payout details to receive it on ${when}.`;
  if (balances.ready < minPayout) return `After ${tds}% TDS. Below the ${rupees(minPayout)} minimum, so it rolls into the next payout.`;
  if (!nextPayout.eligible && nextPayout.blockers.length) return nextPayout.blockers.join(' ');
  return `After ${tds}% TDS. Goes out ${when} to your ${methodLabel(me)}.`;
}

export default function Home() {
  const router = useRouter();
  const toast = useToast();
  const cardRef = useRef<PartnerCardHandle>(null);
  const me = useMe();
  const summary = useSummary();
  const program = useProgram().data ?? FALLBACK_PROGRAM;
  const [refreshing, setRefreshing] = useState(false);
  const [animateIntro] = useState(() => !introPlayed);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([me.refetch(), summary.refetch()]);
    setRefreshing(false);
  };

  const affiliate = me.data;
  const data = summary.data;
  if (affiliate && data) introPlayed = true;

  const copy = async () => {
    if (!affiliate) return;
    await Clipboard.setStringAsync(affiliate.code);
    haptic.success();
    cardRef.current?.flash();
    toast.show('Code copied');
  };

  const share = () => {
    if (!affiliate || !data) return;
    Share.share({
      message: `I use Core Asana in my practice and recommend it to my students. Use my code ${affiliate.code} for ${program.customerDiscountPct}% off: ${data.shareUrl}`,
    }).catch(() => {});
  };

  const countDelay = animateIntro ? 650 : 0;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <TabHeader title={affiliate ? `${greeting()}, ${firstName(affiliate.name)}` : greeting()} />

      {!affiliate || !data ? (
        summary.isError || me.isError ? (
          <View style={styles.errorBox}>
            <T v="bodyStrong">Couldn't load your earnings</T>
            <T v="small" style={{ marginTop: 4, marginBottom: 14 }}>
              {(summary.error ?? me.error)?.message}
            </T>
            <Button label="Try again" variant="secondary" onPress={refresh} />
          </View>
        ) : (
          <HomeSkeleton />
        )
      ) : (
        <>
          <PartnerCard
            ref={cardRef}
            code={affiliate.code}
            discountPct={program.customerDiscountPct}
            ratePct={program.commissionRatePct}
            animateIn={animateIntro}
            onCopy={copy}
            onShare={share}
          />

          {(!affiliate.payoutMethod || !affiliate.panLast4) && (
            <Animated.View entering={FadeIn.delay(animateIntro ? 900 : 0)}>
              <PressableScale accessibilityRole="button" onPress={() => router.push('/payout-method')} style={styles.nudge}>
                <View style={{ flex: 1 }}>
                  <T v="bodyStrong" style={{ color: colors.white }}>
                    {!affiliate.payoutMethod ? 'Add where we should pay you' : 'Add your PAN'}
                  </T>
                  <T v="small" style={{ color: colors.lavenderSoft, marginTop: 2 }}>
                    {!affiliate.payoutMethod
                      ? `UPI or bank details, so ${weekdayName(program.payoutWeekday)}'s payout can reach you.`
                      : `TDS is ${program.tdsNoPanRatePct}% without PAN and ${program.tdsRatePct}% with it.`}
                  </T>
                </View>
                <T v="smallStrong" style={{ color: colors.lavender }}>
                  Add
                </T>
              </PressableScale>
            </Animated.View>
          )}

          <View style={styles.ledger}>
            <View style={[styles.ledgerRow, styles.readyRow]}>
              <View style={styles.readyMark} />
              <View style={{ flex: 1 }}>
                <T v="smallStrong">Ready for {weekdayName(toDate(data.nextPayout.date).getDay())}'s payout</T>
                <T v="caption" style={{ marginTop: 3 }}>
                  {readyNote(data, affiliate, program)}
                </T>
              </View>
              {/* Net of TDS, the same figure the Payouts tab shows, so the two screens never disagree. */}
              <CountUpMoney value={data.nextPayout.estimatedNet} delay={countDelay} style={styles.amountReady} />
            </View>
            <View style={[styles.ledgerRow, styles.divider]}>
              <View style={{ flex: 1 }}>
                <T v="smallStrong">On hold</T>
                <T v="caption" style={{ marginTop: 3 }}>
                  Clears after the {program.holdDays}-day return window.
                </T>
              </View>
              <CountUpMoney value={data.balances.onHold} delay={countDelay + 80} />
            </View>
            {data.balances.inPayout > 0 && (
              <View style={[styles.ledgerRow, styles.divider]}>
                <View style={{ flex: 1 }}>
                  <T v="smallStrong">In payout</T>
                  <T v="caption" style={{ marginTop: 3 }}>
                    Being transferred to you now.
                  </T>
                </View>
                <CountUpMoney value={data.balances.inPayout} delay={countDelay + 120} />
              </View>
            )}
            <View style={[styles.ledgerRow, styles.divider]}>
              <View style={{ flex: 1 }}>
                <T v="smallStrong">Paid so far</T>
                <T v="caption" style={{ marginTop: 3 }}>
                  Since you joined, after TDS.
                </T>
              </View>
              <CountUpMoney value={data.balances.paidTotal} delay={countDelay + 160} style={{ color: colors.leaf }} />
            </View>
          </View>

          <T v="body" style={styles.month}>
            {data.stats30d.orders > 0
              ? `In the last 30 days your code was used in ${data.stats30d.orders} ${data.stats30d.orders === 1 ? 'order' : 'orders'} worth ${rupeesRounded(data.stats30d.sales)}, and ${data.stats30d.clicks} people opened your link. You earned ${rupeesRounded(data.stats30d.earned)}.`
              : data.stats30d.clicks > 0
                ? `${data.stats30d.clicks} people opened your link in the last 30 days. Orders appear here as soon as someone checks out with your code.`
                : `No orders yet. Share your code after your next class, and every order with it will show up here.`}
          </T>

          <View style={styles.sectionHead}>
            <T v="heading">Recent orders</T>
            {data.recent.length > 0 && (
              <PressableScale accessibilityRole="link" onPress={() => router.push('/earnings')} hitSlop={10}>
                <T v="smallStrong" style={{ color: colors.lavenderDeep }}>
                  See all
                </T>
              </PressableScale>
            )}
          </View>
          {data.recent.length ? (
            <View style={styles.list}>
              {data.recent.map((c, i) => (
                <CommissionLine key={c.id} c={c} last={i === data.recent.length - 1} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <T v="small">When a student checks out with {affiliate.code}, the order and your commission show up here.</T>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function HomeSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <Skeleton height={232} style={{ borderRadius: radius.card }} />
      <Skeleton height={200} style={{ borderRadius: radius.panel }} />
      <Skeleton height={16} width="80%" />
      <Skeleton height={16} width="60%" />
    </View>
  );
}

const styles = StyleSheet.create({
  nudge: {
    marginTop: 14,
    backgroundColor: colors.midnight,
    borderRadius: radius.panel,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ledger: {
    marginTop: 14,
    backgroundColor: colors.white,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  readyRow: { backgroundColor: '#FFFBF3', paddingVertical: 18 },
  readyMark: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.amber },
  amountReady: { fontSize: 28, lineHeight: 34 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  month: { marginTop: 22, color: colors.slate, lineHeight: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 4 },
  list: { backgroundColor: colors.white, borderRadius: radius.panel, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  empty: { padding: 16, borderRadius: radius.panel, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line },
  errorBox: { padding: 18, backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line },
});
