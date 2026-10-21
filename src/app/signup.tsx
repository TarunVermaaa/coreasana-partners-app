import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Share, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ApiError } from '@/api/client';
import { useCodeAvailability, useProgram } from '@/api/hooks';
import type { Audience } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { BackBar } from '@/components/BackBar';
import { Button, PressableScale } from '@/components/Button';
import { Chips } from '@/components/Chips';
import { Field, type FieldRef } from '@/components/Field';
import { PartnerCard } from '@/components/PartnerCard';
import { Screen } from '@/components/Screen';
import { T } from '@/components/T';
import { haptic } from '@/lib/haptics';
import { FALLBACK_PROGRAM, suggestCode } from '@/lib/program';
import { colors, figures, fonts, radius } from '@/theme/tokens';

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'teacher', label: 'Yoga teacher' },
  { value: 'studio', label: 'Studio' },
  { value: 'physio', label: 'Physiotherapist' },
  { value: 'creator', label: 'Wellness creator' },
  { value: 'other', label: 'Something else' },
];

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'audience' | 'code' | 'form', string>>;
const STEP1_FIELDS = ['name', 'email', 'phone', 'password', 'audience'] as const;

function validateAbout(v: { name: string; email: string; phone: string; password: string; audience: Audience | null }): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = 'Enter your name as students know you.';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (!/^(\+?91)?[6-9]\d{9}$/.test(v.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a 10-digit Indian mobile number.';
  if (v.password.length < 8) e.password = 'Use at least 8 characters.';
  if (!v.audience) e.audience = 'Choose the one closest to you.';
  return e;
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Signup() {
  const router = useRouter();
  const { state, signup } = useAuth();
  const program = useProgram().data ?? FALLBACK_PROGRAM;
  const signedInAtMount = useRef(state.status === 'signedIn');

  const [step, setStep] = useState<'about' | 'code' | 'done'>('about');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [audience, setAudience] = useState<Audience | null>(null);
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<FieldRef>(null);
  const phoneRef = useRef<FieldRef>(null);
  const passwordRef = useRef<FieldRef>(null);

  const debouncedCode = useDebounced(code, 350);
  const availability = useCodeAvailability(debouncedCode, step === 'code');
  const checking = code !== debouncedCode || availability.isFetching;
  const codeOk = !checking && availability.data?.available === true && availability.data.code === code;

  if (signedInAtMount.current) return <Redirect href="/home" />;

  const goToCode = () => {
    const e = validateAbout({ name, email, phone, password, audience });
    setErrors(e);
    if (Object.keys(e).length) {
      haptic.error();
      return;
    }
    if (!codeTouched) setCode(suggestCode(name, program.customerDiscountPct));
    setStep('code');
  };

  const submit = async () => {
    if (!codeOk || !audience) return;
    setBusy(true);
    setErrors({});
    try {
      await signup({ name: name.trim(), email: email.trim(), phone: phone.replace(/[\s-]/g, ''), password, audience, code });
      haptic.success();
      setStep('done');
    } catch (e) {
      haptic.error();
      if (e instanceof ApiError) {
        const fieldErrors: Errors = {};
        for (const d of e.details) fieldErrors[d.field as keyof Errors] = d.message;
        if (!e.details.length) {
          // 409s name the clashing field in the message ("email already registered" etc.)
          if (/email/i.test(e.message)) fieldErrors.email = e.message;
          else if (/phone/i.test(e.message)) fieldErrors.phone = e.message;
          else if (/code/i.test(e.message)) fieldErrors.code = e.message;
          else fieldErrors.form = e.message;
        }
        setErrors(fieldErrors);
        if (STEP1_FIELDS.some((f) => fieldErrors[f])) setStep('about');
      } else {
        setErrors({ form: 'Something went wrong. Try again.' });
      }
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done') {
    const message = `I use and recommend Core Asana in my practice. Use my code ${code} for ${program.customerDiscountPct}% off at coreasana.com`;
    return (
      <Screen contentStyle={styles.doneContent}>
        <Animated.View entering={FadeIn.duration(300)}>
          <T v="title" style={{ marginTop: 28 }}>
            Your code {code} is live
          </T>
          <T v="small" style={{ marginTop: 8, marginBottom: 22 }}>
            Students can use it at checkout from today. Every order with your code shows up in Earnings within a minute.
          </T>
        </Animated.View>
        <PartnerCard code={code} discountPct={program.customerDiscountPct} ratePct={program.commissionRatePct} />
        <View style={{ gap: 6, marginTop: 24 }}>
          <Button label="Share your code" onPress={() => Share.share({ message }).catch(() => {})} />
          <Button label="Go to my earnings" variant="quiet" onPress={() => router.replace('/home')} />
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackBar right={step === 'about' ? 'Step 1 of 2' : 'Step 2 of 2'} onBack={step === 'code' ? () => setStep('about') : undefined} />

        {step === 'about' ? (
          <Animated.View key="about" entering={FadeInDown.duration(260)}>
            <T v="title">About you</T>
            <T v="small" style={styles.sub}>
              Takes about a minute. You'll add payout details later, when there's money to send.
            </T>
            <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} error={errors.name} />
            <Field
              ref={emailRef}
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              error={errors.email}
            />
            <Field
              ref={phoneRef}
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.phone}
              hint="We'll only use it for payout questions."
            />
            <Field ref={passwordRef} label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" error={errors.password} hint="At least 8 characters." />
            <T v="smallStrong" style={{ marginBottom: 10 }}>
              How will you share Core Asana?
            </T>
            <Chips options={AUDIENCES} value={audience} onChange={setAudience} accessibilityLabel="How will you share Core Asana?" />
            {errors.audience && (
              <T v="small" style={styles.error}>
                {errors.audience}
              </T>
            )}
            <Button label="Next: pick your code" onPress={goToCode} style={{ marginTop: 28 }} />
          </Animated.View>
        ) : (
          <Animated.View key="code" entering={FadeInDown.duration(260)}>
            <T v="title">Pick your code</T>
            <T v="small" style={styles.sub}>
              Students type this at checkout, so make it easy to say out loud. Letters and numbers, 4 to 12 characters.
            </T>
            <TextInput
              value={code}
              onChangeText={(t) => {
                setCodeTouched(true);
                setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12));
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              accessibilityLabel="Partner code"
              style={[styles.codeInput, codeOk && styles.codeInputOk, availability.data && !availability.data.available && !checking && styles.codeInputBad]}
            />
            <View style={styles.availability} accessibilityLiveRegion="polite">
              {code.length < 4 ? (
                <T v="small">Keep going: at least 4 characters.</T>
              ) : checking ? (
                <T v="small">Checking {code}…</T>
              ) : availability.isError ? (
                <T v="small" style={{ color: colors.vermilion }}>
                  Couldn't check this code. Check your connection, then edit the code to try again.
                </T>
              ) : codeOk ? (
                <T v="smallStrong" style={{ color: colors.leaf }}>
                  {code} is available
                </T>
              ) : (
                <T v="small" style={{ color: colors.vermilion }}>
                  {availability.data?.reason ?? `${code} is taken.`}
                </T>
              )}
            </View>
            {!checking && availability.data && !availability.data.available && availability.data.suggestions.length > 0 && (
              <Animated.View entering={FadeIn} style={styles.suggestions}>
                <T v="caption" style={{ width: '100%' }}>
                  Available instead:
                </T>
                {availability.data.suggestions.map((s) => (
                  <PressableScale
                    key={s}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${s}`}
                    onPress={() => {
                      haptic.select();
                      setCodeTouched(true);
                      setCode(s);
                    }}
                    style={styles.suggestion}
                  >
                    <T style={styles.suggestionText}>{s}</T>
                  </PressableScale>
                ))}
              </Animated.View>
            )}
            {errors.code && (
              <T v="small" style={styles.error}>
                {errors.code}
              </T>
            )}
            {errors.form && (
              <T v="small" style={styles.error}>
                {errors.form}
              </T>
            )}

            <View style={{ marginTop: 22 }}>
              <PartnerCard code={code || 'YOURCODE'} discountPct={program.customerDiscountPct} ratePct={program.commissionRatePct} animateIn={false} />
            </View>

            <Button label="Create partner account" onPress={submit} loading={busy} disabled={!codeOk} style={{ marginTop: 24 }} />
            <T v="caption" style={{ marginTop: 10, textAlign: 'center' }}>
              By creating an account you agree to the partner terms.
            </T>
          </Animated.View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 6, marginBottom: 24 },
  error: { color: colors.vermilion, marginTop: 8 },
  codeInput: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.midnight,
    borderBottomWidth: 2,
    borderColor: colors.line,
    paddingVertical: 8,
    letterSpacing: 1.5,
    ...figures.lining,
  },
  codeInputOk: { borderColor: colors.leaf },
  codeInputBad: { borderColor: colors.vermilion },
  availability: { minHeight: 28, justifyContent: 'center', marginTop: 8 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  suggestion: { borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8 },
  suggestionText: { fontFamily: fonts.display, fontSize: 16, color: colors.midnight, ...figures.lining },
  doneContent: { paddingTop: 12 },
});
