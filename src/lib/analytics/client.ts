import AsyncStorage from '@react-native-async-storage/async-storage';
import { posthog } from '@/lib/posthog';
import { EventName, EventProperties } from './events';

const ANALYTICS_OPT_OUT_KEY = 'analytics_opt_out';

class Analytics {
  private isOptedOut = false;

  /**
   * Initialize opt-out state from AsyncStorage.
   * Call this on app startup before any analytics calls.
   */
  async initialize(): Promise<void> {
    try {
      const value = await AsyncStorage.getItem(ANALYTICS_OPT_OUT_KEY);
      this.isOptedOut = value === 'true';
    } catch {
      // Default to not opted out if storage read fails
      this.isOptedOut = false;
    }
  }

  /**
   * Set the analytics opt-out state.
   * When opted out, no events will be sent to PostHog.
   */
  async setOptOut(optOut: boolean): Promise<void> {
    this.isOptedOut = optOut;
    try {
      await AsyncStorage.setItem(ANALYTICS_OPT_OUT_KEY, optOut ? 'true' : 'false');
    } catch {
      // Silently fail storage write
    }

    if (optOut) {
      // Reset PostHog to clear user identification
      posthog.reset();
    }
  }

  /**
   * Check if analytics is currently opted out.
   */
  getOptOut(): boolean {
    return this.isOptedOut;
  }

  track<T extends EventName>(
    eventName: T,
    ...args: EventProperties<T> extends Record<string, never>
      ? []
      : [properties: EventProperties<T>]
  ): void {
    if (this.isOptedOut) {
      return;
    }
    const properties = args[0];
    posthog.capture(eventName, properties);
  }
}

export const analytics = new Analytics();
