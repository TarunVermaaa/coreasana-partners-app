import { Redirect, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { Field, type FieldRef } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { T } from '@/components/T';
import { haptic } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

export default function Login() {
  const router = useRouter();
  const { state, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<FieldRef>(null);

  if (state.status === 'signedIn') return <Redirect href="/home" />;

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      haptic.success();
      router.replace('/home');
    } catch (e) {
      haptic.error();
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackBar />
        <T v="title" style={styles.title}>
          Welcome back
        </T>
        <T v="small" style={styles.sub}>
          Log in with the email you signed up with.
        </T>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <Field
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {error && (
          <View style={styles.error} accessibilityLiveRegion="polite">
            <T v="small" style={{ color: colors.vermilion }}>
              {error}
            </T>
          </View>
        )}
        <Button label="Log in" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
        <Button label="New here? Create a partner account" variant="quiet" onPress={() => router.replace('/signup')} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 8 },
  sub: { marginTop: 6, marginBottom: 24 },
  error: { marginBottom: 8 },
});
