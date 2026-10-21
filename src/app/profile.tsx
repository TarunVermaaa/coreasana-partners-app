import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { api } from '@/api/client';
import { useMe } from '@/api/hooks';
import type { Audience } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { BackBar } from '@/components/BackBar';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { T } from '@/components/T';
import { shortDate } from '@/lib/format';
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
  const { logout } = useAuth();
  const { data: me } = useMe();

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
            <Row label="Mobile" value={me.phone} />
            <Row label="Status" value={me.status === 'active' ? 'Active' : 'Paused by the partner team'} last={!me.instagram} />
            {me.instagram ? <Row label="Instagram" value={`@${me.instagram.replace(/^@/, '')}`} last /> : null}
          </View>
          {me.status === 'suspended' && (
            <T v="small" style={{ color: colors.vermilion, marginTop: 10 }}>
              Your code is paused, so new orders don't earn commission. Contact the Core Asana partner team to sort it out.
            </T>
          )}
          <Button label="Payout details" variant="secondary" onPress={() => router.push('/payout-method')} style={{ marginTop: 18 }} />
          <Button
            label="Log out"
            variant="danger"
            onPress={async () => {
              await logout();
              router.replace('/welcome');
            }}
            style={{ marginTop: 10 }}
          />
        </>
      ) : (
        <View style={{ gap: 12 }}>
          <Skeleton height={30} width="60%" />
          <Skeleton height={200} style={{ borderRadius: radius.panel }} />
        </View>
      )}

      <View style={styles.meta}>
        <T v="caption">Core Asana Partners {Constants.expoConfig?.version ?? ''}</T>
        <T v="caption" style={{ fontFamily: fonts.mono }}>
          {api.usingFixtures ? 'Sample data mode' : api.baseUrl}
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.white, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 8 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  meta: { marginTop: 36, alignItems: 'center', gap: 2 },
});
