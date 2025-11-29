import { DB_TABLES } from '@/constants/database';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_USER_PREFERENCES,
  mergeWithDefaults,
  UserPreferences,
} from '@/types/userPreferences.types';

class UserSettingsService {
  /**
   * Get user preferences, returning defaults if none exist.
   */
  async getSettings(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_SETTINGS)
      .select('preferences')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = Row not found - return defaults
      if (error.code === 'PGRST116') {
        return DEFAULT_USER_PREFERENCES;
      }
      throw error;
    }

    return mergeWithDefaults(data?.preferences as Partial<UserPreferences>);
  }

  /**
   * Update user preferences (upsert - creates if doesn't exist).
   */
  async updateSettings(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    // First get current preferences to merge
    const current = await this.getSettings(userId);
    const merged = { ...current, ...updates };

    const { data, error } = await supabase
      .from(DB_TABLES.USER_SETTINGS)
      .upsert(
        {
          user_id: userId,
          preferences: merged,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select('preferences')
      .single();

    if (error) throw error;

    return mergeWithDefaults(data?.preferences as Partial<UserPreferences>);
  }
}

export const userSettingsService = new UserSettingsService();
