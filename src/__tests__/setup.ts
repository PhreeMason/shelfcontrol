import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {},
  manifest: {},
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  deviceType: 1,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
    })),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  QueryClient: jest.fn().mockImplementation(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Mock Toast
jest.mock('react-native-toast-message/lib/src/Toast', () => ({
  Toast: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

// Mock Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('posthog-react-native', () => {
  const mockPostHogInstance = {
    capture: jest.fn(),
    identify: jest.fn(),
    screen: jest.fn(),
    group: jest.fn(),
    alias: jest.fn(),
    reset: jest.fn(),
    isFeatureEnabled: jest.fn(),
    getFeatureFlag: jest.fn(),
    reloadFeatureFlags: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
    getDistinctId: jest.fn(() => 'test-distinct-id'),
    flush: jest.fn(),
    shutdown: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockPostHogInstance),
    PostHog: jest.fn(() => mockPostHogInstance),
    usePostHog: jest.fn(() => mockPostHogInstance),
  };
});

jest.mock('@/lib/posthog', () => ({
  posthog: {
    capture: jest.fn(),
    identify: jest.fn(),
    screen: jest.fn(),
    group: jest.fn(),
    alias: jest.fn(),
    reset: jest.fn(),
    isFeatureEnabled: jest.fn(),
    getFeatureFlag: jest.fn(),
    reloadFeatureFlags: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
    getDistinctId: jest.fn(() => 'test-distinct-id'),
    flush: jest.fn(),
    shutdown: jest.fn(),
  },
}));

// Suppress console warnings for tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
