import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useAuth } from '@/auth/AuthContext';
import { TabBar } from '@/components/TabBar';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  const { state } = useAuth();
  if (state.status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.mist } }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings' }} />
      <Tabs.Screen name="payouts" options={{ title: 'Payouts' }} />
    </Tabs>
  );
}
