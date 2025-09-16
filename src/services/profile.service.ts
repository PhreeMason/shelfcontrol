import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(profileId: string, updates: UpdateProfileParams) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update profile with Apple authentication data
   */
  async updateProfileFromApple(userId: string, appleData: AppleProfileData) {
    const updates: Partial<Profile> = {};

    // Handle email - only update if it's a real email (not private relay)
    if (
      appleData.email &&
      !appleData.email.includes('@privaterelay.appleid.com')
    ) {
      updates.email = appleData.email;
    }

    // Handle name - extract first and last name if provided
    if (appleData.fullName) {
      if (appleData.fullName.givenName) {
        updates.first_name = appleData.fullName.givenName;
      }
      if (appleData.fullName.familyName) {
        updates.last_name = appleData.fullName.familyName;
      }
    }

    // Only proceed if we have something to update
    if (Object.keys(updates).length === 0) {
      return this.getProfile(userId);
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Upload avatar for a user
   */
  async uploadAvatar(userId: string, uri: string) {
    try {
      // First, remove any existing avatars for this user
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map(
          file => `${userId}/${file.name}`
        );
        await supabase.storage.from('avatars').remove(filesToRemove);
      }

      // Fetch the image and convert to arraybuffer
      const arraybuffer = await fetch(uri).then(res => res.arrayBuffer());

      // Get file extension from URI
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const path = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
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
   * Get avatar URL for a user
   */
  async getAvatarUrl(userId: string): Promise<string | null> {
    try {
      const { data: files, error } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (error) throw error;

      if (!files || files.length === 0) {
        return null;
      }

      // Get the most recent file (highest timestamp)
      const sortedFiles = files
        .filter(file => file.name.startsWith('avatar-'))
        .sort((a, b) => b.created_at?.localeCompare(a.created_at || '') || 0);

      if (sortedFiles.length === 0) {
        return null;
      }

      const avatarPath = `${userId}/${sortedFiles[0].name}`;
      return this.getAvatarSignedUrl(avatarPath);
    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return null;
    }
  }

  /**
   * Get a signed URL for an avatar
   */
  async getAvatarSignedUrl(avatarPath: string): Promise<string | null> {
    try {
      if (!avatarPath) return null;

      const THREE_MONTHS_IN_SECONDS = 90 * 24 * 60 * 60;
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(avatarPath, THREE_MONTHS_IN_SECONDS);

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
