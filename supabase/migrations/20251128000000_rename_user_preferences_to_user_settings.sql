-- Rename table from user_preferences to user_settings
-- This creates a clear semantic distinction:
--   - "Preferences" = client-side AsyncStorage (PreferencesProvider)
--   - "Settings" = server-synced Supabase settings (analytics, crash reporting, etc.)

ALTER TABLE user_preferences RENAME TO user_settings;

-- Rename the foreign key constraint to match the new table name
ALTER TABLE user_settings
  RENAME CONSTRAINT user_preferences_user_id_fkey TO user_settings_user_id_fkey;

-- Note: RLS policies are attached by OID (internal table identifier), not name,
-- so they automatically apply to the renamed table without any additional changes.
