import { toastConfig } from '@/components/ui/ToastConfig';
import { posthog } from '@/lib/posthog';
import AuthProvider from '@/providers/AuthProvider';
import { DeadlineProvider } from '@/providers/DeadlineProvider';
import PreferencesProvider from '@/providers/PreferencesProvider';
import ShelfProvider from '@/providers/ShelfProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter: require('../assets/fonts/Inter-Regular.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-ExtraLight': require('../assets/fonts/Nunito-ExtraLight.ttf'),
    'Nunito-Light': require('../assets/fonts/Nunito-Light.ttf'),
    'Nunito-Medium': require('../assets/fonts/Nunito-Medium.ttf'),
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider client={posthog}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <PreferencesProvider>
              <DeadlineProvider>
                <ShelfProvider>
                  <Stack>
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(authenticated)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="deadline"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </ShelfProvider>
              </DeadlineProvider>
            </PreferencesProvider>
            <Toast config={toastConfig} />
          </QueryClientProvider>
        </AuthProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}
