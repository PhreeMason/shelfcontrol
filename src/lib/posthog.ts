import PostHog from 'posthog-react-native';

const postHogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

if (!postHogApiKey) {
  throw new Error(
    'EXPO_PUBLIC_POSTHOG_API_KEY is not defined. Please check your .env file.'
  );
}

export const posthog = new PostHog(postHogApiKey, {
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
});
