import {
  APPLE_AUTH,
  AVATAR_CONFIG,
  DB_TABLES,
  STORAGE_BUCKETS,
} from '@/constants/database';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { activityService } from './activity.service';

type Profile = Database['public']['Tables']['profiles']['Row'];

export type UpdateProfileParams = Partial<Profile>;

export interface AppleProfileData {
  email?: string | null;
  fullName?: {
    givenName?: string;
    familyName?: string;
  };
}

class ProfileService {
  /**
   * Get profile by user ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data: results, error } = await supabase
      .from(DB_TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .limit(1);

    const data = results?.[0];

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data || null;
  }

  async updateProfile(profileId: string, updates: UpdateProfileParams) {
    const { data: updateResults, error } = await supabase
      .from(DB_TABLES.PROFILES)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .limit(1);

    const data = updateResults?.[0];

    if (error) throw error;
    if (!data) throw new Error('Profile not found');

    activityService.trackUserActivity('profile_updated', {
      fields: Object.keys(updates),
    });

    return data;
  }

  /**
   * Update profile with Apple authentication data
   */
  async updateProfileFromApple(userId: string, appleData: AppleProfileData) {
    const updates: Partial<Profile> = {};

    if (
      appleData.email &&
      !appleData.email.includes(APPLE_AUTH.PRIVATE_RELAY_DOMAIN)
    ) {
      updates.email = appleData.email;
    }

    if (appleData.fullName) {
      if (appleData.fullName.givenName) {
        updates.first_name = appleData.fullName.givenName;
      }
      if (appleData.fullName.familyName) {
        updates.last_name = appleData.fullName.familyName;
      }
    }

    if (Object.keys(updates).length === 0) {
      return this.getProfile(userId);
    }

    const { data: updateResults, error } = await supabase
      .from(DB_TABLES.PROFILES)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .limit(1);

    const data = updateResults?.[0];

    if (error) throw error;
    if (!data) throw new Error('Profile not found');
    return data;
  }

  /**
   * Upload avatar for a user
   */
  async uploadAvatar(userId: string, uri: string) {
    try {
      const { data: existingFiles } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map(
          file => `${userId}/${file.name}`
        );
        await supabase.storage
          .from(STORAGE_BUCKETS.AVATARS)
          .remove(filesToRemove);
      }

      const arraybuffer = await fetch(uri).then(res => res.arrayBuffer());

      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const fileName = `${AVATAR_CONFIG.FILE_PREFIX}${Date.now()}.${fileExt}`;
      const path = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(path, arraybuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) throw error;

      return data.path;
    } catch (err) {
      console.error('Avatar upload error:', err);
      throw err;
    }
  }

  /**
   * Get avatar path for a user (returns storage path, not URL)
   */
  async getAvatarPath(userId: string): Promise<string | null> {
    try {
      const { data: files, error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .list(userId);

      if (error) throw error;

      if (!files || files.length === 0) {
        return null;
      }

      const sortedFiles = files
        .filter(file => file.name.startsWith(AVATAR_CONFIG.FILE_PREFIX))
        .sort((a, b) => b.created_at?.localeCompare(a.created_at || '') || 0);

      if (sortedFiles.length === 0) {
        return null;
      }

      const avatarPath = `${userId}/${sortedFiles[0].name}`;
      return avatarPath;
    } catch (error) {
      console.error('Error getting avatar path:', error);
      return null;
    }
  }

  async getAvatarSignedUrl(avatarPath: string): Promise<string | null> {
    try {
      if (!avatarPath) return null;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .createSignedUrl(avatarPath, AVATAR_CONFIG.SIGNED_URL_EXPIRY);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  }
}

export const profileService = new ProfileService();
