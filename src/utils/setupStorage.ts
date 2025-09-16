import { supabase } from '@/lib/supabase';

/**
 * Setup function to create the avatars bucket if it doesn't exist
 * Run this once to ensure the storage bucket is properly configured
 */
export async function setupAvatarsBucket() {
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
      const { data, error: createError } = await supabase.storage.createBucket(
        'avatars',
        {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
          ],
          fileSizeLimit: 5242880, // 5MB
        }
      );

      if (createError) {
        console.error('Error creating avatars bucket:', createError);
        return { success: false, error: createError };
      }

      console.log('Avatars bucket created successfully:', data);
      return { success: true, data };
    } else {
      console.log('Avatars bucket already exists');

      // Update bucket to ensure it's public
      const { data, error: updateError } = await supabase.storage.updateBucket(
        'avatars',
        {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
          ],
          fileSizeLimit: 5242880, // 5MB
        }
      );

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
 * Test function to verify the avatars bucket is accessible
 */
export async function testAvatarsBucket() {
  try {
    const { data, error } = await supabase.storage.from('avatars').list();

    if (error) {
      console.error('Avatars bucket test failed:', error);
      return false;
    }

    console.log('Avatars bucket is accessible. Files:', data);
    return true;
  } catch (error) {
    console.error('Error testing avatars bucket:', error);
    return false;
  }
}
