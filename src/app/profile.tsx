import Constants from 'expo-constants';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { api } from '@/api/client';
import { useMe } from '@/api/hooks';
import type { Audience } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ServerSheet } from '@/components/ServerSheet';
import { Skeleton } from '@/components/Skeleton';
import { T } from '@/components/T';
import { formatPhone, shortDate } from '@/lib/format';
import { colors, fonts, radius } from '@/theme/tokens';

const AUDIENCE: Record<Audience, string> = {
  teacher: 'Yoga teacher',
  studio: 'Studio',
  physio: 'Physiotherapist',
  creator: 'Wellness creator',
  other: 'Partner',
};

function Row({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <T v="small" style={{ width: 110 }}>
        {label}
      </T>
      <T v={mono ? 'mono' : 'body'} style={{ flex: 1 }} selectable>
        {value}
      </T>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { state, logout } = useAuth();
  const { data: me, isError, error, refetch } = useMe();
  const [serverOpen, setServerOpen] = useState(false);

  if (state.status === 'signedOut') return <Redirect href="/welcome" />;

  const signOut = async () => {
    await logout();
    router.replace('/welcome');
  };

  return (
    <Screen>
      <BackBar />
      {me ? (
        <>
          <T v="title">{me.name}</T>
          <T v="small" style={{ marginTop: 4, marginBottom: 20 }}>
            {AUDIENCE[me.audience]}
            {me.city ? ` in ${me.city}` : ''}, partner since {shortDate(me.createdAt)}
          </T>
          <View style={styles.panel}>
            <Row label="Partner code" value={me.code} />
            <Row label="Email" value={me.email} />
            <Row label="Mobile" value={formatPhone(me.phone)} />
            <Row label="Status" value={me.status === 'active' ? 'Active' : 'Paused by the partner team'} last={!me.instagram} />
            {me.instagram ? <Row label="Instagram" value={`@${me.instagram.replace(/^@/, '')}`} last /> : null}
          </View>
          {me.status === 'suspended' && (
            <T v="small" style={{ color: colors.vermilion, marginTop: 10 }}>
              Your code is paused, so new orders don't earn commission. Contact the Core Asana partner team to sort it out.
            </T>
          )}
          <Button label="Payout details" variant="secondary" onPress={() => router.push('/payout-method')} style={{ marginTop: 18 }} />
        </>
      ) : isError ? (
        <View style={styles.errorBox}>
          <T v="bodyStrong">Couldn't load your profile</T>
          <T v="small" style={{ marginTop: 4, marginBottom: 14 }}>
            {error?.message}
          </T>
          <Button label="Try again" variant="secondary" onPress={() => refetch()} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Skeleton height={30} width="60%" />
          <Skeleton height={200} style={{ borderRadius: radius.panel }} />
        </View>
      )}

      {/* Always available, even when the profile can't load, so the app can never trap a partner. */}
      <Button label="Log out" variant="danger" onPress={signOut} style={{ marginTop: 10 }} />

      <View style={styles.meta}>
        <T v="caption">Core Asana Partners {Constants.expoConfig?.version ?? ''}</T>
        <Pressable onLongPress={() => setServerOpen(true)} delayLongPress={600} accessibilityHint="Long press to change the server address">
          <T v="caption" style={{ fontFamily: fonts.mono }}>
            {api.usingFixtures ? 'Sample data mode' : api.baseUrl}
          </T>
        </Pressable>
      </View>
      <ServerSheet visible={serverOpen} onClose={() => setServerOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 8 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  meta: { marginTop: 36, alignItems: 'center', gap: 2 },
  errorBox: { padding: 18, backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line },
});
