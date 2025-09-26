import { Loader } from '@/components/shared/Loader';
import { useAuth } from '@/providers/AuthProvider';
import { Redirect, Slot } from 'expo-router';

export default function AuthLayout() {
  const { isLoading, session: isSignedIn } = useAuth();

  if (isLoading) {
    return <Loader />;
  }
  if (isSignedIn) {
    return <Redirect href="/" />;
  }
  return <Slot />;
}
