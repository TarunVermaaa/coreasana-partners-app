import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '@/api/client';
import { colors } from '@/theme/tokens';
import { Button } from './Button';
import { Field } from './Field';
import { Sheet } from './Sheet';
import { T } from './T';

/**
 * Hidden setting (long-press the wordmark on Welcome): point the app at another API server,
 * e.g. a laptop on the same Wi-Fi. One APK can then be reviewed against any backend.
 */
export function ServerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState(api.baseUrl);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setUrl(api.baseUrl);
      setStatus(null);
    }
  }, [visible]);

  const test = async (candidate: string) => {
    const res = await fetch(`${candidate.replace(/\/+$/, '')}/api/v1/health`).catch(() => null);
    return !!res && res.ok;
  };

  const save = async () => {
    const value = url.trim();
    if (!/^https?:\/\/.+/.test(value)) {
      setStatus({ tone: 'error', text: 'Enter a full address starting with http:// or https://' });
      return;
    }
    setBusy(true);
    const ok = await test(value);
    setBusy(false);
    if (!ok) {
      setStatus({ tone: 'error', text: `No response from ${value}/api/v1/health. Check the address and that the API is running.` });
      return;
    }
    await api.setBaseUrl(value);
    qc.clear();
    setStatus({ tone: 'ok', text: 'Connected. The app now uses this server.' });
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Server address">
      <T v="small" style={{ marginBottom: 14 }}>
        The app talks to the partner API at this address. Use your computer's LAN IP when testing on a phone, for example http://192.168.1.20:4100.
      </T>
      <Field label="API address" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      {status && (
        <T v="small" style={{ color: status.tone === 'ok' ? colors.leaf : colors.vermilion, marginBottom: 12 }}>
          {status.text}
        </T>
      )}
      <View style={{ gap: 10 }}>
        <Button label="Save and connect" onPress={save} loading={busy} />
        <Button
          label="Use the default"
          variant="quiet"
          onPress={async () => {
            await api.setBaseUrl(null);
            setUrl(api.baseUrl);
            qc.clear();
            setStatus({ tone: 'ok', text: `Back to ${api.defaultBaseUrl}` });
          }}
        />
      </View>
    </Sheet>
  );
}
