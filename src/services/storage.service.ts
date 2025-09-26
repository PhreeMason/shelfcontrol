import { supabase } from '@/lib/supabase';

class StorageService {
  /**
   * Setup the avatars bucket if it doesn't exist
   */
  async setupAvatarsBucket() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } =
        await supabase.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        return { success: false, error: listError };
      }

      const avatarsBucketExists = buckets?.some(
        bucket => bucket.id === 'avatars'
      );

      if (!avatarsBucketExists) {
        // Create the avatars bucket
        const { data, error: createError } =
          await supabase.storage.createBucket('avatars', {
            public: true,
            allowedMimeTypes: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
            ],
            fileSizeLimit: 5242880, // 5MB
          });

        if (createError) {
          console.error('Error creating avatars bucket:', createError);
          return { success: false, error: createError };
        }

        return { success: true, data };
      } else {

        // Update bucket to ensure it's public
        const { data, error: updateError } =
          await supabase.storage.updateBucket('avatars', {
            public: true,
            allowedMimeTypes: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
            ],
            fileSizeLimit: 5242880, // 5MB
          });

        if (updateError) {
          console.error('Error updating avatars bucket:', updateError);
          return { success: false, error: updateError };
        }

        return { success: true, data };
      }
    } catch (error) {
      console.error('Unexpected error setting up avatars bucket:', error);
      return { success: false, error };
    }
  }

  /**
   * Test if the avatars bucket is accessible
   */
  async testAvatarsBucket() {
    try {
      const { data, error } = await supabase.storage.from('avatars').list();

      if (error) {
        console.error('Avatars bucket test failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error testing avatars bucket:', error);
      return false;
    }
  }

  /**
   * List files in a bucket
   */
  async listFiles(bucket: string, path?: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) throw error;
    return data;
  }

  /**
   * Upload a file to a bucket
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: ArrayBuffer | Blob,
    options?: {
      contentType?: string;
      upsert?: boolean;
    }
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);

    if (error) throw error;
    return data;
  }

  /**
   * Remove files from a bucket
   */
  async removeFiles(bucket: string, paths: string[]) {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);

    if (error) throw error;
    return data;
  }

  /**
   * Create a signed URL for a file
   */
  async createSignedUrl(bucket: string, path: string, expiresIn: number) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * Get the public URL for a file
   */
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}

export const storageService = new StorageService();
