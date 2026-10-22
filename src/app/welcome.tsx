import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api/client';
import { useProgram } from '@/api/hooks';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/Button';
import { CountUpMoney } from '@/components/CountUp';
import { PartnerCard } from '@/components/PartnerCard';
import { ServerSheet } from '@/components/ServerSheet';
import { Slider } from '@/components/Slider';
import { T } from '@/components/T';
import { Wordmark } from '@/components/Wordmark';
import { rupees, weekdayName } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { earningPerOrder, FALLBACK_PROGRAM } from '@/lib/program';
import { colors, figures, fonts, radius } from '@/theme/tokens';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  const { data, isError } = useProgram();
  const program = data ?? FALLBACK_PROGRAM;
  const [students, setStudents] = useState(8);
  const [serverOpen, setServerOpen] = useState(false);

  // Most partners land here first: wake a sleeping server now so signup or login is quick later.
  useEffect(() => api.wake(), []);

  if (state.status === 'signedIn') return <Redirect href="/home" />;

  const perOrder = earningPerOrder(program);
  const monthly = perOrder * students;
  const payday = weekdayName(program.payoutWeekday);

  const steps = [
    {
      title: 'Pick a code students can remember',
      body: `Something like PRIYA10. Say it at the end of class, put it in your bio, or pin it in your studio's WhatsApp group.`,
    },
    {
      title: 'Students use it at checkout on coreasana.com',
      body: `They get ${program.customerDiscountPct}% off, and the order is linked to you automatically.`,
    },
    {
      title: `Get paid every ${payday}`,
      body: `Orders clear after the ${program.holdDays}-day return window. Once you've earned ${rupees(program.minPayout)}, it goes straight to your UPI or bank account.`,
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onLongPress={() => {
            haptic.tap();
            setServerOpen(true);
          }}
          delayLongPress={600}
          accessibilityHint="Long press to change the server address"
          style={styles.wordmark}
        >
          <Wordmark />
        </Pressable>

        <T v="hero" style={styles.headline}>
          Your students already ask which mat you use.
        </T>
        <T v="body" style={styles.lede}>
          Core Asana Partners is for yoga teachers, physiotherapists, studios and wellness creators. Share your code: your students get {program.customerDiscountPct}% off, and you earn {program.commissionRatePct}% of every order.
        </T>

        <View style={styles.cardPreview}>
          <PartnerCard code="PRIYA10" discountPct={program.customerDiscountPct} ratePct={program.commissionRatePct} />
          <T v="caption" style={styles.cardCaption}>
            An example card. Yours will carry the code you pick when you sign up.
          </T>
        </View>

        <View style={styles.calculator}>
          <View style={styles.calcHead}>
            <T v="smallStrong" style={{ flex: 1 }}>
              Students who order in a month
            </T>
            <T style={styles.calcCount}>{students}</T>
          </View>
          <Slider value={students} min={1} max={40} onChange={setStudents} accessibilityLabel="Students who order in a month" />
          <View style={styles.result}>
            <T v="small">You'd earn about</T>
            <View style={styles.resultRow}>
              <CountUpMoney value={monthly} v="amountXL" duration={450} />
              <T v="small" style={styles.perMonth}>
                a month
              </T>
            </View>
          </View>
          <T v="caption" style={styles.fineprint}>
            Based on an average order of {rupees(program.averageOrderValue)}, after your students' {program.customerDiscountPct}% discount. That's about {rupees(perOrder)} for you per order.
          </T>
        </View>

        <T v="heading" style={styles.sectionTitle}>
          How it works
        </T>
        {steps.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.stepNum}>
              <T style={styles.stepNumText}>{i + 1}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">{s.title}</T>
              <T v="small" style={{ marginTop: 2 }}>
                {s.body}
              </T>
            </View>
          </View>
        ))}

        <T v="caption" style={styles.terms}>
          No joining fee and no targets. TDS is deducted under section 194H: {program.tdsRatePct}% with your PAN on file, {program.tdsNoPanRatePct}% without.
        </T>
        {isError && (
          <T v="caption" style={styles.offline}>
            Can't reach the partner server right now. The numbers above are the standard terms.
          </T>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Button label="Create partner account" onPress={() => router.push('/signup')} />
        <Button label="I already have an account" variant="quiet" onPress={() => router.push('/login')} style={{ minHeight: 44 }} />
      </View>

      <ServerSheet visible={serverOpen} onClose={() => setServerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mist },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  wordmark: { alignSelf: 'flex-start', paddingVertical: 14 },
  headline: { marginTop: 18, maxWidth: 340 },
  lede: { marginTop: 12, color: colors.slate, maxWidth: 360 },
  cardPreview: { marginTop: 26 },
  cardCaption: { marginTop: 10 },
  calculator: {
    marginTop: 26,
    backgroundColor: colors.white,
    borderRadius: radius.panel,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  calcHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  calcCount: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.midnight, ...figures.tabular },
  result: { marginTop: 14 },
  resultRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  perMonth: { color: colors.slate },
  fineprint: { marginTop: 10 },
  sectionTitle: { marginTop: 32, marginBottom: 14 },
  step: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontFamily: fonts.display, fontSize: 15, lineHeight: 19, color: colors.midnight, ...figures.lining },
  terms: { marginTop: 6 },
  offline: { marginTop: 8, color: colors.vermilion },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 4,
    backgroundColor: colors.mist,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
