/**
 * User preferences stored in Supabase as JSONB.
 * This is separate from the local UI preferences in PreferencesProvider (AsyncStorage).
 *
 * These settings are server-synced and persist across devices.
 */
export interface UserPreferences {
  // Privacy settings
  analytics_enabled: boolean;
  crash_reporting_enabled: boolean;

  // Reading preferences
  require_pause_notes: boolean;
  require_dnf_notes: boolean;

  // Future display preferences (uncomment when implementing)
  // theme: 'default' | 'dark' | 'warm' | 'cool' | 'mint' | 'mono';
  // text_size: number;
  // colorblind_mode: 'none' | 'deuteranopia' | 'tritanopia';
}

/**
 * Default values for all preferences.
 * Used when a user has no preferences set or when merging partial preferences.
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  analytics_enabled: true,
  crash_reporting_enabled: true,
  require_pause_notes: false,
  require_dnf_notes: false,
};

/**
 * Merges partial preferences from the database with defaults.
 * Ensures all preference keys are present even if not stored in DB.
 */
export function mergeWithDefaults(
  partial: Partial<UserPreferences> | null | undefined
): UserPreferences {
  return { ...DEFAULT_USER_PREFERENCES, ...partial };
}
