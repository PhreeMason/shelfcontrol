import PostHog from 'posthog-react-native';

const postHogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

// Define the PostHog interface to ensure type safety for mock
type PostHogInterface = Pick<
  PostHog,
  | 'capture'
  | 'identify'
  | 'reset'
  | 'group'
  | 'alias'
  | 'screen'
  | 'register'
  | 'unregister'
  | 'isFeatureEnabled'
  | 'getFeatureFlag'
  | 'reloadFeatureFlags'
  | 'flush'
  | 'shutdown'
>;

// Create no-op mock for when API key is missing
const createMockPostHog = (): PostHogInterface => ({
  capture: async () => {},
  identify: async () => {},
  reset: async () => {},
  group: () => {},
  alias: () => {},
  screen: async () => {},
  register: async () => {},
  unregister: async () => {},
  isFeatureEnabled: () => false,
  getFeatureFlag: () => undefined,
  reloadFeatureFlags: () => {},
  flush: async () => {},
  shutdown: async () => {},
});

// Export PostHog instance or no-op mock based on API key availability
// This ensures the app never crashes due to missing API key
// Type assertion is safe because mock implements all used methods
export const posthog: PostHog = postHogApiKey
  ? new PostHog(postHogApiKey, {
      host: 'https://us.i.posthog.com',
      enableSessionReplay: true,
      enablePersistSessionIdAcrossRestart: true,
      sessionReplayConfig: {
        maskAllTextInputs: true,
        maskAllImages: true,
        captureLog: true,
        captureNetworkTelemetry: true,
        throttleDelayMs: 1000,
      },
    })
  : (createMockPostHog() as PostHog);
