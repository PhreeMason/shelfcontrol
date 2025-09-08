import { useColorScheme } from '@/hooks/useColorScheme';
import AuthProvider from '@/providers/AuthProvider';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

const queryClient = new QueryClient()

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter: require('../assets/fonts/Inter-Regular.ttf'),
    "Nunito-Bold": require('../assets/fonts/Nunito-Bold.ttf'),
    "Nunito-ExtraBold": require('../assets/fonts/Nunito-ExtraBold.ttf'),
    "Nunito-ExtraLight": require('../assets/fonts/Nunito-ExtraLight.ttf'),
    "Nunito-Light": require('../assets/fonts/Nunito-Light.ttf'),
    "Nunito-Medium": require('../assets/fonts/Nunito-Medium.ttf'),
    "Nunito-Regular": require('../assets/fonts/Nunito-Regular.ttf'),
    "Nunito-SemiBold": require('../assets/fonts/Nunito-SemiBold.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ThemeProvider>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
