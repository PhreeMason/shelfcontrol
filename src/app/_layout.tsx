import { toastConfig } from '@/components/ui/ToastConfig';
import { supabase } from '@/lib/supabase';
import { posthog } from '@/lib/posthog';
import AuthProvider from '@/providers/AuthProvider';
import { DeadlineProvider } from '@/providers/DeadlineProvider';
import PreferencesProvider from '@/providers/PreferencesProvider';
import ShelfProvider from '@/providers/ShelfProvider';
import { isAuthError } from '@/utils/errorUtils';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Track if we're already refreshing to avoid multiple simultaneous attempts
let isRefreshing = false;

// Reference to the QueryClient for use in the error handler
let queryClientInstance: QueryClient;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: async error => {
      // Automatically try to refresh the session on auth errors
      if (isAuthError(error) && queryClientInstance && !isRefreshing) {
        isRefreshing = true;
        try {
          const { error: refreshError } =
            await supabase.auth.refreshSession();

          if (!refreshError) {
            // Refresh succeeded - invalidate all queries to retry with new token
            // User won't see any error, queries will automatically retry
            queryClientInstance.invalidateQueries();
          }
          // If refresh failed, the error will propagate and show user-friendly message
        } catch {
          // Refresh threw an error, let the original error propagate
        } finally {
          isRefreshing = false;
        }
      }
    },
  }),
});

// Store reference for the error handler
queryClientInstance = queryClient;

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
