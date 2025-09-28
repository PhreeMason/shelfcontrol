import { profileService, UpdateProfileParams } from '@/services';
import { AppleProfileData } from '@/services/profile.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useAvatarUrl = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['avatar', 'url', userId],
    queryFn: async () => {
      if (!userId) return null;
      return profileService.getAvatarUrl(userId);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: !!userId,
  });
};

export const useAvatarSignedUrl = (avatarPath: string | null | undefined) => {
  return useQuery({
    queryKey: ['avatar', 'signedUrl', avatarPath],
    queryFn: async () => {
      if (!avatarPath) return null;
      return profileService.getAvatarSignedUrl(avatarPath);
    },
    staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days (signed URLs last 3 months)
    enabled: !!avatarPath,
  });
};

export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      return profileService.getProfile(userId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateProfile'],
    mutationFn: async ({
      profileId,
      updates,
    }: {
      profileId: string;
      updates: UpdateProfileParams;
    }) => {
      return profileService.updateProfile(profileId, updates);
    },
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['avatar'] });
    },
    onError: error => {
      console.error('Error updating profile:', error);
    },
  });
};

export const useUpdateProfileFromApple = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateProfileFromApple'],
    mutationFn: async ({
      userId,
      appleData,
    }: {
      userId: string;
      appleData: AppleProfileData;
    }) => {
      return profileService.updateProfileFromApple(userId, appleData);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
    onError: error => {
      console.error('Error updating profile from Apple:', error);
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['uploadAvatar'],
    mutationFn: async ({ userId, uri }: { userId: string; uri: string }) => {
      return profileService.uploadAvatar(userId, uri);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['avatar', 'url', userId] });
      queryClient.invalidateQueries({ queryKey: ['avatar', 'signedUrl'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
    onError: error => {
      console.error('Error uploading avatar:', error);
    },
  });
};