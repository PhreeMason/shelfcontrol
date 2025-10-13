import { profileService } from '@/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useAvatarPath,
  useAvatarSignedUrl,
  useProfile,
  useUpdateProfile,
  useUpdateProfileFromApple,
  useUploadAvatar,
} from '../useProfile';

jest.mock('@/services', () => ({
  profileService: {
    getProfile: jest.fn(),
    getAvatarPath: jest.fn(),
    getAvatarSignedUrl: jest.fn(),
    updateProfile: jest.fn(),
    updateProfileFromApple: jest.fn(),
    uploadAvatar: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

const mockProfileService = profileService as jest.Mocked<typeof profileService>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<
  typeof useQueryClient
>;

describe('useProfile hooks', () => {
  const mockQueryClient = {
    invalidateQueries: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue(mockQueryClient as any);
  });

  describe('useProfile', () => {
    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      avatar_url: 'avatar-path',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      username: 'testuser',
      website: null,
      onboarding_complete: true,
      role: 'user' as const,
    };

    it('should call useQuery with correct parameters for valid userId', () => {
      const userId = 'user-123';
      useProfile(userId);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['profile', userId],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: true,
      });
    });

    it('should call useQuery with enabled false for undefined userId', () => {
      useProfile(undefined);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['profile', undefined],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 5,
        enabled: false,
      });
    });

    it('should call profileService.getProfile when queryFn is executed', async () => {
      const userId = 'user-123';
      mockProfileService.getProfile.mockResolvedValue(mockProfile);

      useProfile(userId);
      const queryCall = mockUseQuery.mock.calls[0][0];
      const result = await (queryCall.queryFn as any)();

      expect(mockProfileService.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockProfile);
    });

    it('should return null when userId is undefined in queryFn', async () => {
      useProfile(undefined);
      const queryCall = mockUseQuery.mock.calls[0][0];
      const result = await (queryCall.queryFn as any)();

      expect(result).toBeNull();
      expect(mockProfileService.getProfile).not.toHaveBeenCalled();
    });

    it('should handle service errors in queryFn', async () => {
      const userId = 'user-123';
      const error = new Error('Profile not found');
      mockProfileService.getProfile.mockRejectedValue(error);

      useProfile(userId);
      const queryCall = mockUseQuery.mock.calls[0][0];

      await expect((queryCall.queryFn as any)()).rejects.toThrow(
        'Profile not found'
      );
    });
  });

  describe('useAvatarPath', () => {
    it('should call useQuery with correct parameters for valid userId', () => {
      const userId = 'user-123';
      useAvatarPath(userId);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['avatar', 'url', userId],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        enabled: true,
      });
    });

    it('should call useQuery with enabled false for undefined userId', () => {
      useAvatarPath(undefined);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['avatar', 'url', undefined],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 60 * 24,
        enabled: false,
      });
    });

    it('should call profileService.getAvatarPath when queryFn is executed', async () => {
      const userId = 'user-123';
      const avatarPath = 'user-123/avatar-123456.jpg';
      mockProfileService.getAvatarPath.mockResolvedValue(avatarPath);

      useAvatarPath(userId);
      const queryCall = mockUseQuery.mock.calls[0][0];
      const result = await (queryCall.queryFn as any)();

      expect(mockProfileService.getAvatarPath).toHaveBeenCalledWith(userId);
      expect(result).toBe(avatarPath);
    });

    it('should return null when userId is undefined in queryFn', async () => {
      useAvatarPath(undefined);
      const queryCall = mockUseQuery.mock.calls[0][0];
      const result = await (queryCall.queryFn as any)();

      expect(result).toBeNull();
      expect(mockProfileService.getAvatarPath).not.toHaveBeenCalled();
    });

    it('should handle service errors in queryFn', async () => {
      const userId = 'user-123';
      const error = new Error('Avatar not found');
      mockProfileService.getAvatarPath.mockRejectedValue(error);

      useAvatarPath(userId);
      const queryCall = mockUseQuery.mock.calls[0][0];

      await expect((queryCall.queryFn as any)()).rejects.toThrow(
        'Avatar not found'
      );
    });
  });

  describe('useAvatarSignedUrl', () => {
    it('should call useQuery with correct parameters for valid avatarPath', () => {
      const avatarPath = 'avatars/user-123.jpg';
      useAvatarSignedUrl(avatarPath);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['avatar', 'signedUrl', avatarPath],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days
        enabled: true,
      });
    });

    it('should call useQuery with enabled false for null avatarPath', () => {
      useAvatarSignedUrl(null);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['avatar', 'signedUrl', undefined],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 60 * 24 * 30,
        enabled: false,
      });
    });

    it('should call useQuery with enabled false for undefined avatarPath', () => {
      useAvatarSignedUrl(undefined);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['avatar', 'signedUrl', undefined],
        queryFn: expect.any(Function),
        staleTime: 1000 * 60 * 60 * 24 * 30,
        enabled: false,
      });
    });

    it('should call profileService.getAvatarSignedUrl when queryFn is executed', async () => {
      const avatarPath = 'avatars/user-123.jpg';
      const signedUrl = 'https://storage.example.com/signed-url';
      mockProfileService.getAvatarSignedUrl.mockResolvedValue(signedUrl);

      useAvatarSignedUrl(avatarPath);
      const queryCall = mockUseQuery.mock.calls[0][0];
      const result = await (queryCall.queryFn as any)();

      expect(mockProfileService.getAvatarSignedUrl).toHaveBeenCalledWith(
        avatarPath
      );
      expect(result).toBe(signedUrl);
    });

    it('should return null when avatarPath is null in queryFn', async () => {
      useAvatarSignedUrl(null);
      const queryCall = mockUseQuery.mock.calls[0][0];
      const result = await (queryCall.queryFn as any)();

      expect(result).toBeNull();
      expect(mockProfileService.getAvatarSignedUrl).not.toHaveBeenCalled();
    });

    it('should return null when avatarPath is undefined in queryFn', async () => {
      useAvatarSignedUrl(undefined);
      const queryCall = mockUseQuery.mock.calls[0][0];
      const result = await (queryCall.queryFn as any)();

      expect(result).toBeNull();
      expect(mockProfileService.getAvatarSignedUrl).not.toHaveBeenCalled();
    });

    it('should handle service errors in queryFn', async () => {
      const avatarPath = 'avatars/user-123.jpg';
      const error = new Error('Signed URL generation failed');
      mockProfileService.getAvatarSignedUrl.mockRejectedValue(error);

      useAvatarSignedUrl(avatarPath);
      const queryCall = mockUseQuery.mock.calls[0][0];

      await expect((queryCall.queryFn as any)()).rejects.toThrow(
        'Signed URL generation failed'
      );
    });
  });

  describe('useUpdateProfile', () => {
    const mockMutationResult = {
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
      error: null,
    };

    beforeEach(() => {
      mockUseMutation.mockReturnValue(mockMutationResult as any);
    });

    it('should call useMutation with correct parameters', () => {
      useUpdateProfile();

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationKey: ['updateProfile'],
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should call profileService.updateProfile when mutationFn is executed', async () => {
      const profileId = 'profile-123';
      const updates = { first_name: 'Updated' };
      const mockResult = {
        id: profileId,
        email: null,
        first_name: 'Updated',
        last_name: null,
        avatar_url: null,
        created_at: null,
        updated_at: null,
        username: null,
        website: null,
        onboarding_complete: null,
        role: null,
      };
      mockProfileService.updateProfile.mockResolvedValue(mockResult);

      useUpdateProfile();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      const result = await (mutationCall.mutationFn as any)({
        profileId,
        updates,
      });

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        profileId,
        updates
      );
      expect(result).toEqual(mockResult);
    });

    it('should invalidate correct queries on success', async () => {
      const profileId = 'profile-123';
      const updates = { first_name: 'Updated' };

      useUpdateProfile();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      await (mutationCall.onSuccess as any)({}, { profileId, updates });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['profile', profileId],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['avatar'],
      });
    });

    it('should log error on mutation failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Update failed');

      useUpdateProfile();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      await (mutationCall.onError as any)(error);

      expect(consoleSpy).toHaveBeenCalledWith('Error updating profile:', error);
      consoleSpy.mockRestore();
    });

    it('should handle service errors in mutationFn', async () => {
      const profileId = 'profile-123';
      const updates = { first_name: 'Updated' };
      const error = new Error('Service error');
      mockProfileService.updateProfile.mockRejectedValue(error);

      useUpdateProfile();
      const mutationCall = mockUseMutation.mock.calls[0][0];

      await expect(
        (mutationCall.mutationFn as any)({ profileId, updates })
      ).rejects.toThrow('Service error');
    });
  });

  describe('useUpdateProfileFromApple', () => {
    const mockMutationResult = {
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
      error: null,
    };

    beforeEach(() => {
      mockUseMutation.mockReturnValue(mockMutationResult as any);
    });

    it('should call useMutation with correct parameters', () => {
      useUpdateProfileFromApple();

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationKey: ['updateProfileFromApple'],
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should call profileService.updateProfileFromApple when mutationFn is executed', async () => {
      const userId = 'user-123';
      const appleData = {
        email: 'apple@example.com',
        fullName: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };
      const mockResult = {
        id: userId,
        role: 'user' as const,
        email: appleData.email,
        first_name: null,
        last_name: null,
        avatar_url: null,
        created_at: null,
        updated_at: null,
        username: null,
        website: null,
        onboarding_complete: null,
      };
      mockProfileService.updateProfileFromApple.mockResolvedValue(mockResult);

      useUpdateProfileFromApple();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      const result = await (mutationCall.mutationFn as any)({
        userId,
        appleData,
      });

      expect(mockProfileService.updateProfileFromApple).toHaveBeenCalledWith(
        userId,
        appleData
      );
      expect(result).toEqual(mockResult);
    });

    it('should invalidate profile queries on success', async () => {
      const userId = 'user-123';
      const appleData = {
        email: 'apple@example.com',
        fullName: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };

      useUpdateProfileFromApple();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      await (mutationCall.onSuccess as any)({}, { userId, appleData });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['profile', userId],
      });
    });

    it('should log error on mutation failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Apple update failed');

      useUpdateProfileFromApple();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      await (mutationCall.onError as any)(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating profile from Apple:',
        error
      );
      consoleSpy.mockRestore();
    });

    it('should handle service errors in mutationFn', async () => {
      const userId = 'user-123';
      const appleData = {
        email: 'apple@example.com',
        fullName: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };
      const error = new Error('Apple service error');
      mockProfileService.updateProfileFromApple.mockRejectedValue(error);

      useUpdateProfileFromApple();
      const mutationCall = mockUseMutation.mock.calls[0][0];

      await expect(
        (mutationCall.mutationFn as any)({ userId, appleData })
      ).rejects.toThrow('Apple service error');
    });
  });

  describe('useUploadAvatar', () => {
    const mockMutationResult = {
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
      error: null,
    };

    beforeEach(() => {
      mockUseMutation.mockReturnValue(mockMutationResult as any);
    });

    it('should call useMutation with correct parameters', () => {
      useUploadAvatar();

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationKey: ['uploadAvatar'],
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      });
    });

    it('should call profileService.uploadAvatar when mutationFn is executed', async () => {
      const userId = 'user-123';
      const uri = 'file://avatar.jpg';
      const mockResult = 'avatars/user-123.jpg';
      mockProfileService.uploadAvatar.mockResolvedValue(mockResult);

      useUploadAvatar();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      const result = await (mutationCall.mutationFn as any)({ userId, uri });

      expect(mockProfileService.uploadAvatar).toHaveBeenCalledWith(userId, uri);
      expect(result).toEqual(mockResult);
    });

    it('should invalidate multiple avatar-related queries on success', async () => {
      const userId = 'user-123';
      const uri = 'file://avatar.jpg';

      useUploadAvatar();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      await (mutationCall.onSuccess as any)({}, { userId, uri });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['avatar', 'url', userId],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['avatar', 'signedUrl'],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['profile', userId],
      });
    });

    it('should log error on mutation failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Upload failed');

      useUploadAvatar();
      const mutationCall = mockUseMutation.mock.calls[0][0];
      await (mutationCall.onError as any)(error);

      expect(consoleSpy).toHaveBeenCalledWith('Error uploading avatar:', error);
      consoleSpy.mockRestore();
    });

    it('should handle service errors in mutationFn', async () => {
      const userId = 'user-123';
      const uri = 'file://avatar.jpg';
      const error = new Error('Upload service error');
      mockProfileService.uploadAvatar.mockRejectedValue(error);

      useUploadAvatar();
      const mutationCall = mockUseMutation.mock.calls[0][0];

      await expect(
        (mutationCall.mutationFn as any)({ userId, uri })
      ).rejects.toThrow('Upload service error');
    });
  });

  describe('Integration Scenarios', () => {
    it('should enable queries correctly based on parameter presence', () => {
      useProfile('user-123');
      useAvatarPath('user-123');
      useAvatarSignedUrl('avatar-path');

      const profileCall = mockUseQuery.mock.calls[0][0];
      const avatarUrlCall = mockUseQuery.mock.calls[1][0];
      const signedUrlCall = mockUseQuery.mock.calls[2][0];

      expect(profileCall.enabled).toBe(true);
      expect(avatarUrlCall.enabled).toBe(true);
      expect(signedUrlCall.enabled).toBe(true);
    });

    it('should disable queries correctly for falsy parameters', () => {
      useProfile(undefined);
      useAvatarPath(undefined);
      useAvatarSignedUrl('');

      const profileCall = mockUseQuery.mock.calls[0][0];
      const avatarUrlCall = mockUseQuery.mock.calls[1][0];
      const signedUrlCall = mockUseQuery.mock.calls[2][0];

      expect(profileCall.enabled).toBe(false);
      expect(avatarUrlCall.enabled).toBe(false);
      expect(signedUrlCall.enabled).toBe(false);
    });

    it('should configure stale times correctly for different data types', () => {
      useProfile('user-123');
      useAvatarPath('user-123');
      useAvatarSignedUrl('avatar-path');

      const profileCall = mockUseQuery.mock.calls[0][0];
      const avatarUrlCall = mockUseQuery.mock.calls[1][0];
      const signedUrlCall = mockUseQuery.mock.calls[2][0];

      expect(profileCall.staleTime).toBe(1000 * 60 * 5); // 5 minutes
      expect(avatarUrlCall.staleTime).toBe(1000 * 60 * 60 * 24); // 24 hours
      expect(signedUrlCall.staleTime).toBe(1000 * 60 * 60 * 24 * 30); // 30 days
    });

    it('should handle complex cache invalidation patterns', async () => {
      const userId = 'user-123';

      // Test upload avatar invalidation (most complex)
      useUploadAvatar();
      const uploadCall = mockUseMutation.mock.calls[0][0];
      await (uploadCall.onSuccess as any)(
        {},
        { userId, uri: 'file://test.jpg' }
      );

      // Should invalidate 3 different query patterns
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['avatar', 'url', userId],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['avatar', 'signedUrl'],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['profile', userId],
      });
    });
  });
});
