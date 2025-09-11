import { Stack } from 'expo-router';

export default function DeadlineLayout() {
  return (
    <Stack>
      <Stack.Screen name="new" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/view" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/reading-session" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/edit" options={{ headerShown: false }} />
    </Stack>
  );
}
