import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET_NAME = 'avatars';
const THREE_MONTHS_IN_SECONDS = 90 * 24 * 60 * 60; // 3 months in seconds

export const getAvatarSignedUrl = async (avatarPath: string): Promise<string | null> => {
    try {
        if (!avatarPath) return null;
        
        const { data, error } = await supabase.storage
            .from(AVATAR_BUCKET_NAME)
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
};

export const getAvatarUrl = (userId: string): Promise<string | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const { data: files, error: listError } = await supabase
                .storage
                .from(AVATAR_BUCKET_NAME)
                .list(userId);

            if (listError) throw listError;

            if (!files || files.length === 0) {
                resolve(null);
                return;
            }

            // Get the most recent file (highest timestamp)
            const sortedFiles = files
                .filter(file => file.name.startsWith('avatar-'))
                .sort((a, b) => b.created_at?.localeCompare(a.created_at || '') || 0);

            if (sortedFiles.length === 0) {
                resolve(null);
                return;
            }

            const avatarPath = `${userId}/${sortedFiles[0].name}`;
            const signedUrl = await getAvatarSignedUrl(avatarPath);
            resolve(signedUrl);
        } catch (error) {
            reject(error);
        }
    });
};
