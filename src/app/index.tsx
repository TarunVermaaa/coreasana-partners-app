import { Redirect } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';

export default function Index() {
  const { state } = useAuth();
  return <Redirect href={state.status === 'signedIn' ? '/home' : '/welcome'} />;
}
