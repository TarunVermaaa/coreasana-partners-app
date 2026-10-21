import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useCommissions, useProgram } from '@/api/hooks';
import { useRefreshOnFocus } from '@/api/useRefreshOnFocus';
import type { Commission, CommissionStatus } from '@/api/types';
import { Button } from '@/components/Button';
import { Chips } from '@/components/Chips';
import { CommissionRow } from '@/components/CommissionCard';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { T } from '@/components/T';
import { TabHeader } from '@/components/TabHeader';
import { rupeesRounded, toDate } from '@/lib/format';
import { FALLBACK_PROGRAM } from '@/lib/program';
import { colors, figures, radius } from '@/theme/tokens';

type Filter = 'all' | CommissionStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'On hold' },
  { value: 'approved', label: 'Ready' },
  { value: 'in_payout', label: 'In payout' },
  { value: 'paid', label: 'Paid' },
  { value: 'reversed', label: 'Reversed' },
];

const EMPTY: Record<Filter, string> = {
  all: 'No orders with your code yet. When a student checks out with it, the order shows up here within a minute.',
  pending: 'Nothing on hold. New orders wait here until their return window ends.',
  approved: 'Nothing waiting for payout right now.',
  in_payout: 'No payout is being processed for you right now.',
  paid: 'No paid commissions yet. Payouts go out every Friday.',
  reversed: 'No reversed orders. Commissions are reversed only when an order is refunded.',
  rejected: 'Nothing here.',
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Passbook-style grouping: one panel per month, newest first, with what that month earned. */
function groupByMonth(items: Commission[]) {
  const groups: { key: string; label: string; items: Commission[]; earned: number; count: number }[] = [];
  const thisYear = new Date().getFullYear();
  for (const c of items) {
    const d = toDate(c.order.placedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: d.getFullYear() === thisYear ? MONTH_NAMES[d.getMonth()] : `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, items: [], earned: 0, count: 0 };
      groups.push(g);
    }
    g.items.push(c);
    if (c.status !== 'reversed' && c.status !== 'rejected') g.earned += c.amount;
    if (c.kind === 'sale') g.count += 1;
  }
  return groups;
}

export default function Earnings() {
  const [filter, setFilter] = useState<Filter>('all');
  const program = useProgram().data ?? FALLBACK_PROGRAM;
  const query = useCommissions(filter === 'all' ? undefined : filter);
  useRefreshOnFocus(query.refetch);
  const [refreshing, setRefreshing] = useState(false);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Screen
      onRefresh={async () => {
        setRefreshing(true);
        await query.refetch();
        setRefreshing(false);
      }}
      refreshing={refreshing}
    >
      <TabHeader title="Earnings" />
      <T v="small" style={styles.intro}>
        You earn {program.commissionRatePct}% of every order made with your code. Tap an order to see where its commission is.
      </T>
      <View style={styles.filters}>
        <Chips options={FILTERS} value={filter} onChange={setFilter} scroll accessibilityLabel="Filter commissions" />
      </View>

      {query.isPending ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} style={{ borderRadius: radius.control }} />
          ))}
        </View>
      ) : query.isError ? (
        <View style={styles.box}>
          <T v="bodyStrong">Couldn't load your orders</T>
          <T v="small" style={{ marginVertical: 8 }}>
            {query.error.message}
          </T>
          <Button label="Try again" variant="secondary" onPress={() => query.refetch()} />
        </View>
      ) : items.length === 0 ? (
        <Animated.View entering={FadeIn} style={[styles.box, styles.empty]}>
          <T v="small">{EMPTY[filter]}</T>
        </Animated.View>
      ) : (
        <View>
          {groupByMonth(items).map((g) => (
            <View key={g.key} style={styles.group}>
              <View style={styles.groupHead}>
                <T v="heading">{g.label}</T>
                <T v="small" style={figures.tabular}>
                  {g.count} {g.count === 1 ? 'order' : 'orders'}, {rupeesRounded(g.earned)}
                </T>
              </View>
              <View style={styles.panel}>
                {g.items.map((c, i) => (
                  <CommissionRow key={c.id} c={c} holdDays={program.holdDays} last={i === g.items.length - 1} />
                ))}
              </View>
            </View>
          ))}
          {query.hasNextPage && (
            <Button label="Show older orders" variant="secondary" loading={query.isFetchingNextPage} onPress={() => query.fetchNextPage()} style={{ marginTop: 6 }} />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: -8, marginBottom: 16 },
  filters: { marginHorizontal: -20, marginBottom: 16 },
  box: { padding: 18, backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line },
  empty: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  group: { marginBottom: 22 },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  panel: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
});
