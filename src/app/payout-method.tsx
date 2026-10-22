import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ApiError } from '@/api/client';
import { useMe, useProgram, useSavePayoutMethod } from '@/api/hooks';
import { useAuth } from '@/auth/AuthContext';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { Chips } from '@/components/Chips';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { T } from '@/components/T';
import { useToast } from '@/components/Toast';
import { haptic } from '@/lib/haptics';
import { FALLBACK_PROGRAM } from '@/lib/program';
import { IFSC, PAN, UPI_ID } from '@/lib/validation';
import { colors, radius } from '@/theme/tokens';


type Errors = Partial<Record<'upiId' | 'accountName' | 'accountNumber' | 'confirm' | 'ifsc' | 'pan' | 'form', string>>;

export default function PayoutMethod() {
  const router = useRouter();
  const toast = useToast();
  const { state } = useAuth();
  const me = useMe().data;
  const program = useProgram().data ?? FALLBACK_PROGRAM;
  const save = useSavePayoutMethod();

  const current = me?.payoutMethod;
  const [type, setType] = useState<'upi' | 'bank'>(current?.type ?? 'upi');
  const [upiId, setUpiId] = useState(current?.type === 'upi' ? current.upiId : '');
  const [accountName, setAccountName] = useState(current?.type === 'bank' ? current.accountName : (me?.name ?? ''));
  const [accountNumber, setAccountNumber] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ifsc, setIfsc] = useState(current?.type === 'bank' ? current.ifsc : '');
  const [pan, setPan] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  // The profile may arrive after this screen opens (deep link or refresh). Prefill from it once,
  // unless the partner has already started typing.
  const prefilled = useRef(Boolean(me));
  const edited = useRef(false);
  useEffect(() => {
    if (!me || prefilled.current) return;
    prefilled.current = true;
    if (edited.current) return;
    const m = me.payoutMethod;
    setType(m?.type ?? 'upi');
    if (m?.type === 'upi') setUpiId(m.upiId);
    if (m?.type === 'bank') setIfsc(m.ifsc);
    setAccountName(m?.type === 'bank' ? m.accountName : me.name);
  }, [me]);
  const edit =
    <V,>(setter: (v: V) => void) =>
    (v: V) => {
      edited.current = true;
      setter(v);
    };

  if (state.status === 'signedOut') return <Redirect href="/welcome" />;

  const validate = (): Errors => {
    const e: Errors = {};
    if (type === 'upi') {
      if (!UPI_ID.test(upiId.trim())) e.upiId = 'Enter a UPI ID like name@okicici.';
    } else {
      if (accountName.trim().length < 2) e.accountName = 'Enter the name exactly as it appears on the account.';
      if (!/^\d{9,18}$/.test(accountNumber)) e.accountNumber = 'Account numbers are 9 to 18 digits.';
      else if (confirm !== accountNumber) e.confirm = "The two account numbers don't match.";
      if (!IFSC.test(ifsc)) e.ifsc = 'IFSC has 11 characters, like HDFC0001234.';
    }
    if (pan && !PAN.test(pan)) e.pan = 'PAN looks like ABCDE1234F.';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      haptic.error();
      return;
    }
    try {
      await save.mutateAsync(
        type === 'upi'
          ? { type: 'upi', upiId: upiId.trim(), ...(pan ? { pan } : {}) }
          : { type: 'bank', accountName: accountName.trim(), accountNumber, ifsc, ...(pan ? { pan } : {}) },
      );
      haptic.success();
      toast.show('Payout details saved');
      router.back();
    } catch (err) {
      haptic.error();
      if (err instanceof ApiError && err.details.length) {
        const fe: Errors = {};
        for (const d of err.details) fe[d.field as keyof Errors] = d.message;
        setErrors(fe);
      } else {
        setErrors({ form: err instanceof Error ? err.message : 'Could not save. Try again.' });
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackBar />
        <T v="title">Payout details</T>
        <T v="small" style={styles.sub}>
          Every Friday, your ready balance is sent here. Use an account in your own name.
        </T>

        <Chips
          options={[
            { value: 'upi', label: 'UPI' },
            { value: 'bank', label: 'Bank account' },
          ]}
          value={type}
          onChange={(v) => {
            edit(setType)(v);
            setErrors({});
          }}
          accessibilityLabel="Payout method"
        />

        <Animated.View key={type} entering={FadeIn.duration(200)} style={{ marginTop: 20 }}>
          {type === 'upi' ? (
            <Field label="UPI ID" value={upiId} onChangeText={edit(setUpiId)} autoCapitalize="none" autoCorrect={false} placeholder="name@okicici" error={errors.upiId} />
          ) : (
            <>
              <Field label="Account holder name" value={accountName} onChangeText={edit(setAccountName)} autoCapitalize="words" error={errors.accountName} />
              <Field
                label="Account number"
                value={accountNumber}
                onChangeText={(t) => edit(setAccountNumber)(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                secureTextEntry={Platform.OS !== 'web'}
                error={errors.accountNumber}
                hint={current?.type === 'bank' ? `Currently ending ${current.accountNumberLast4}. Enter it again to change any bank detail.` : undefined}
              />
              <Field label="Account number again" value={confirm} onChangeText={(t) => edit(setConfirm)(t.replace(/\D/g, ''))} keyboardType="number-pad" error={errors.confirm} />
              <Field
                label="IFSC"
                value={ifsc}
                onChangeText={(t) => edit(setIfsc)(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="HDFC0001234"
                error={errors.ifsc}
              />
            </>
          )}
        </Animated.View>

        <View style={styles.panBox}>
          <Field
            label="PAN (optional)"
            value={pan}
            onChangeText={(t) => edit(setPan)(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={me?.panLast4 ? `On file, ending ${me.panLast4}` : 'ABCDE1234F'}
            error={errors.pan}
            hint={`With PAN, TDS is ${program.tdsRatePct}% of your commission. Without it, the law requires ${program.tdsNoPanRatePct}%.`}
          />
        </View>

        {errors.form && (
          <T v="small" style={{ color: colors.vermilion, marginBottom: 10 }}>
            {errors.form}
          </T>
        )}
        <Button label="Save payout details" onPress={submit} loading={save.isPending} />
        <T v="caption" style={{ marginTop: 12, textAlign: 'center' }}>
          Only the last 4 characters of your account number and PAN are ever shown in the app.
        </T>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 6, marginBottom: 20 },
  panBox: { marginTop: 8, padding: 14, paddingBottom: 0, borderRadius: radius.panel, backgroundColor: colors.lavenderSoft, marginBottom: 18 },
});
