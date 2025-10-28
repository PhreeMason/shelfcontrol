import { posthog } from '@/lib/posthog';
import { EventName, EventProperties } from './events';

class Analytics {
  track<T extends EventName>(
    eventName: T,
    ...args: EventProperties<T> extends Record<string, never>
      ? []
      : [properties: EventProperties<T>]
  ): void {
    const properties = args[0];
    posthog.capture(eventName, properties);
  }
}

export const analytics = new Analytics();
