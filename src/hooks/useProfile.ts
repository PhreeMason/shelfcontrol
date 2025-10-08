import { MUTATION_KEYS, QUERY_KEYS } from '@/constants/queryKeys';
import { profileService, UpdateProfileParams } from '@/services';
import { AppleProfileData } from '@/services/profile.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useAvatarPath = (userId: string | undefined) => {
  return useQuery({
    queryKey: userId
      ? QUERY_KEYS.AVATAR.URL(userId)
      : ['avatar', 'url', undefined],
    queryFn: async () => {
      if (!userId) return null;
      return profileService.getAvatarPath(userId);
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!userId,
  });
};

export const useAvatarSignedUrl = (avatarPath: string | null | undefined) => {
  return useQuery({
    queryKey: avatarPath
      ? QUERY_KEYS.AVATAR.SIGNED_URL(avatarPath)
      : ['avatar', 'signedUrl', undefined],
    queryFn: async () => {
      if (!avatarPath) return null;
      return profileService.getAvatarSignedUrl(avatarPath);
    },
    staleTime: 1000 * 60 * 60 * 24 * 30,
    enabled: !!avatarPath,
  });
};

export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: userId
      ? QUERY_KEYS.PROFILE.DETAIL(userId)
      : ['profile', undefined],
    queryFn: async () => {
      if (!userId) return null;
      return profileService.getProfile(userId);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.PROFILE.UPDATE],
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
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROFILE.DETAIL(profileId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AVATAR.BASE() });
    },
    onError: error => {
      console.error('Error updating profile:', error);
    },
  });
};

export const useUpdateProfileFromApple = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.PROFILE.UPDATE_FROM_APPLE],
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
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROFILE.DETAIL(userId),
      });
    },
    onError: error => {
      console.error('Error updating profile from Apple:', error);
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.AVATAR.UPLOAD],
    mutationFn: async ({ userId, uri }: { userId: string; uri: string }) => {
      return profileService.uploadAvatar(userId, uri);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AVATAR.URL(userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AVATAR.SIGNED_BASE(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROFILE.DETAIL(userId),
      });
    },
    onError: error => {
      console.error('Error uploading avatar:', error);
    },
  });
};
