import { useAuth } from '@/providers/AuthProvider';
import { Redirect, Stack } from 'expo-router';

export default function DeadlineLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return (
    <Stack>
      <Stack.Screen name="new" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/edit" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]/completion-flow"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="[id]/review-form" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]/notes"
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack>
  );
}
