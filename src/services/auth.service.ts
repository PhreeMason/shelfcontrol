import { DB_TABLES, STORAGE_BUCKETS } from '@/constants/database';
import { supabase } from '@/lib/supabase';
import { AuthError, AuthResponse, Session } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { activityService } from './activity.service';
import { storageService } from './storage.service';

AppState.addEventListener('change', state => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  email: string;
  password: string;
}

export interface AppleSignInParams {
  identityToken: string;
}


class AuthService {
  /**
   * Get the current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: SignInParams): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        activityService.trackUserActivity('user_signed_in', {});
      }

      return { data: { user: data.user, session: data.session }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  }

  /**
   * Sign up with email, password, and username
   */
  async signUp({ email, password }: SignUpParams): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email,
          },
        },
      });
      if (error) throw error;

      if (data.user) {
        activityService.trackUserActivity('user_signed_up', {});
      }

      return { data: { user: data.user, session: data.session }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error && !error.message?.includes('Auth session missing')) {
        throw error;
      }
    } catch (error: any) {
      if (!error.message?.includes('Auth session missing')) {
        throw error;
      }
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple({ identityToken }: AppleSignInParams) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });

    if (error) throw error;

    if (data.user) {
      activityService.trackUserActivity('user_signed_in_apple', {});
    }

    return { user: data.user, session: data.session };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Delete all user data while preserving the account.
   * Deletes: deadlines, progress, status, notes, tags, contacts, review tracking, etc.
   * Preserves: profile, auth account, user_preferences
   */
  async deleteAllUserData(userId: string): Promise<void> {
    // Delete in order to respect foreign key constraints
    // Child tables first, then parent tables

    // 1. Delete review platforms (child of review_tracking)
    await supabase
      .from(DB_TABLES.REVIEW_PLATFORMS)
      .delete()
      .eq('user_id', userId);

    // 2. Delete review tracking
    await supabase
      .from(DB_TABLES.REVIEW_TRACKING)
      .delete()
      .eq('user_id', userId);

    // 3. Delete note hashtags (child of deadline_notes and hashtags)
    await supabase
      .from(DB_TABLES.NOTE_HASHTAGS)
      .delete()
      .eq('user_id', userId);

    // 4. Delete hashtags
    await supabase.from(DB_TABLES.HASHTAGS).delete().eq('user_id', userId);

    // 5. Delete deadline notes
    await supabase
      .from(DB_TABLES.DEADLINE_NOTES)
      .delete()
      .eq('user_id', userId);

    // 6. Delete deadline contacts
    await supabase
      .from(DB_TABLES.DEADLINE_CONTACTS)
      .delete()
      .eq('user_id', userId);

    // 7. Delete deadline tags (junction table)
    await supabase.from(DB_TABLES.DEADLINE_TAGS).delete().eq('user_id', userId);

    // 8. Delete tags
    await supabase.from(DB_TABLES.TAGS).delete().eq('user_id', userId);

    // 9. Delete deadline progress
    await supabase
      .from(DB_TABLES.DEADLINE_PROGRESS)
      .delete()
      .eq('user_id', userId);

    // 10. Delete deadline status
    await supabase
      .from(DB_TABLES.DEADLINE_STATUS)
      .delete()
      .eq('user_id', userId);

    // 11. Delete disclosure templates
    await supabase
      .from(DB_TABLES.DISCLOSURE_TEMPLATES)
      .delete()
      .eq('user_id', userId);

    // 12. Delete deadlines (parent table)
    await supabase.from(DB_TABLES.DEADLINES).delete().eq('user_id', userId);

    // 13. Delete user activities
    await supabase
      .from(DB_TABLES.USER_ACTIVITIES)
      .delete()
      .eq('user_id', userId);

    // 14. Delete avatar files from storage
    try {
      const avatarFiles = await storageService.listFiles(
        STORAGE_BUCKETS.AVATARS,
        userId
      );
      if (avatarFiles && avatarFiles.length > 0) {
        const filePaths = avatarFiles.map(file => `${userId}/${file.name}`);
        await storageService.removeFiles(STORAGE_BUCKETS.AVATARS, filePaths);
      }
    } catch (error) {
      // Log but continue - avatar deletion failure shouldn't block data deletion
      console.error('Failed to delete avatar files from storage:', error);
    }

    // 15. Clear profile data (keep email for account identification)
    await supabase
      .from(DB_TABLES.PROFILES)
      .update({
        avatar_url: null,
        username: null,
        first_name: null,
        last_name: null,
        website: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // 16. Delete user settings
    await supabase.from(DB_TABLES.USER_SETTINGS).delete().eq('user_id', userId);

    // Note: We keep the profile row (with email) and books (shared resource)

    activityService.trackUserActivity('user_deleted_all_data', {});
  }

  /**
   * Delete the user's account entirely via edge function.
   * This removes auth user and cascades to all data via FK constraints.
   */
  async deleteAccount(userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId },
    });

    if (error) throw error;
  }
}

export const authService = new AuthService();
