import { RedHatMono_400Regular, RedHatMono_500Medium } from '@expo-google-fonts/red-hat-mono';
import { RedHatText_400Regular, RedHatText_500Medium, RedHatText_600SemiBold, RedHatText_700Bold } from '@expo-google-fonts/red-hat-text';
import { YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { ToastProvider } from '@/components/Toast';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

// React Query refetches stale data when the window regains focus. On a phone the equivalent is the
// app coming back to the foreground; the browser preview already gets focus events.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
}

function Navigator() {
  const { state } = useAuth();
  const ready = state.status !== 'loading';
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.mist }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
          },
        },
      }),
  );
  const [fontsLoaded, fontError] = useFonts({
    YoungSerif_400Regular,
    RedHatText_400Regular,
    RedHatText_500Medium,
    RedHatText_600SemiBold,
    RedHatText_700Bold,
    RedHatMono_400Regular,
    RedHatMono_500Medium,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.mist }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <Navigator />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
