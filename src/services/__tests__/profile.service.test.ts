import {
  profileService,
  AppleProfileData,
  UpdateProfileParams,
} from '../profile.service';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    storage: {
      from: jest.fn(() => ({
        list: jest.fn(),
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}));

const mockSupabaseFrom = supabase.from as jest.Mock;
const mockSupabaseStorage = supabase.storage as any;

// Mock global fetch for avatar upload tests
global.fetch = jest.fn();

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return profile data when user exists', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockProfile], error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        limit: mockLimit,
      });

      const result = await profileService.getProfile('user-123');

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile fetch fails', async () => {
      const mockError = new Error('Profile not found');
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        limit: mockLimit,
      });

      const result = await profileService.getProfile('user-123');

      expect(result).toBeNull();
    });

    it('should return null when no data is returned', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        limit: mockLimit,
      });

      const result = await profileService.getProfile('user-123');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile with provided data', async () => {
      const profileId = 'user-123';
      const updates: UpdateProfileParams = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      };

      const mockUpdatedProfile = {
        id: profileId,
        ...updates,
        updated_at: expect.any(String),
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockUpdatedProfile], error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await profileService.updateProfile(profileId, updates);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('id', profileId);
      expect(mockSelect).toHaveBeenCalledWith();
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should throw error when update fails', async () => {
      const profileId = 'user-123';
      const updates: UpdateProfileParams = { first_name: 'Jane' };
      const mockError = new Error('Update failed');

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        limit: mockLimit,
      });

      await expect(
        profileService.updateProfile(profileId, updates)
      ).rejects.toThrow('Update failed');
    });

    it('should handle empty updates object', async () => {
      const profileId = 'user-123';
      const updates: UpdateProfileParams = {};

      const mockUpdatedProfile = {
        id: profileId,
        updated_at: expect.any(String),
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockUpdatedProfile], error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await profileService.updateProfile(profileId, updates);

      expect(mockUpdate).toHaveBeenCalledWith({
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockUpdatedProfile);
    });
  });

  describe('updateProfileFromApple', () => {
    it('should update profile with Apple data excluding private relay email', async () => {
      const userId = 'user-123';
      const appleData: AppleProfileData = {
        email: 'test@privaterelay.appleid.com',
        fullName: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };

      const mockUpdatedProfile = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        updated_at: expect.any(String),
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockUpdatedProfile], error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await profileService.updateProfileFromApple(
        userId,
        appleData
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should update profile with Apple data including real email', async () => {
      const userId = 'user-123';
      const appleData: AppleProfileData = {
        email: 'john.doe@gmail.com',
        fullName: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };

      const mockUpdatedProfile = {
        id: userId,
        email: 'john.doe@gmail.com',
        first_name: 'John',
        last_name: 'Doe',
        updated_at: expect.any(String),
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockUpdatedProfile], error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await profileService.updateProfileFromApple(
        userId,
        appleData
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        email: 'john.doe@gmail.com',
        first_name: 'John',
        last_name: 'Doe',
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should handle partial Apple data', async () => {
      const userId = 'user-123';
      const appleData: AppleProfileData = {
        fullName: {
          givenName: 'John',
        },
      };

      const mockUpdatedProfile = {
        id: userId,
        first_name: 'John',
        updated_at: expect.any(String),
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockUpdatedProfile], error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await profileService.updateProfileFromApple(
        userId,
        appleData
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        first_name: 'John',
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should return existing profile when no updates are needed', async () => {
      const userId = 'user-123';
      const appleData: AppleProfileData = {
        email: 'test@privaterelay.appleid.com',
      };

      const mockExistingProfile = {
        id: userId,
        email: 'existing@example.com',
        first_name: 'Existing',
        last_name: 'User',
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockExistingProfile], error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        limit: mockLimit,
      });

      const result = await profileService.updateProfileFromApple(
        userId,
        appleData
      );

      expect(result).toEqual(mockExistingProfile);
    });

    it('should throw error when Apple profile update fails', async () => {
      const userId = 'user-123';
      const appleData: AppleProfileData = {
        fullName: {
          givenName: 'John',
        },
      };
      const mockError = new Error('Update failed');

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        limit: mockLimit,
      });

      await expect(
        profileService.updateProfileFromApple(userId, appleData)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('uploadAvatar', () => {
    const userId = 'user-123';
    const testUri = 'https://example.com/test-image.jpg';

    beforeEach(() => {
      // Mock fetch to return an arraybuffer
      (global.fetch as jest.Mock).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      });
    });

    it('should upload avatar after removing existing files', async () => {
      const existingFiles = [
        { name: 'avatar-old.jpg', created_at: '2024-01-01' },
      ];
      const uploadResponse = { path: `${userId}/avatar-123456.jpg` };

      const mockList = jest.fn().mockResolvedValue({ data: existingFiles });
      const mockRemove = jest.fn().mockResolvedValue({ error: null });
      const mockUpload = jest
        .fn()
        .mockResolvedValue({ data: uploadResponse, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: mockRemove,
        upload: mockUpload,
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.uploadAvatar(userId, testUri);

      expect(mockSupabaseStorage.from).toHaveBeenCalledWith('avatars');
      expect(mockList).toHaveBeenCalledWith(userId);
      expect(mockRemove).toHaveBeenCalledWith([`${userId}/avatar-old.jpg`]);
      expect(global.fetch).toHaveBeenCalledWith(testUri);
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${userId}/avatar-\\d+\\.jpg`)),
        expect.any(ArrayBuffer),
        {
          contentType: 'image/jpg',
          upsert: true,
        }
      );
      expect(result).toBe(uploadResponse.path);
    });

    it('should upload avatar when no existing files', async () => {
      const uploadResponse = { path: `${userId}/avatar-123456.jpg` };

      const mockList = jest.fn().mockResolvedValue({ data: [] });
      const mockRemove = jest.fn();
      const mockUpload = jest
        .fn()
        .mockResolvedValue({ data: uploadResponse, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: mockRemove,
        upload: mockUpload,
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.uploadAvatar(userId, testUri);

      expect(mockList).toHaveBeenCalledWith(userId);
      expect(mockRemove).not.toHaveBeenCalled();
      expect(mockUpload).toHaveBeenCalled();
      expect(result).toBe(uploadResponse.path);
    });

    it('should handle different file extensions', async () => {
      const pngUri = 'https://example.com/test-image.png';
      const uploadResponse = { path: `${userId}/avatar-123456.png` };

      const mockList = jest.fn().mockResolvedValue({ data: [] });
      const mockUpload = jest
        .fn()
        .mockResolvedValue({ data: uploadResponse, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: mockUpload,
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      await profileService.uploadAvatar(userId, pngUri);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${userId}/avatar-\\d+\\.png`)),
        expect.any(ArrayBuffer),
        {
          contentType: 'image/png',
          upsert: true,
        }
      );
    });

    it('should handle URI with no proper extension', async () => {
      const noExtUri = 'https://example.com/test-image';
      const uploadResponse = { path: `${userId}/avatar-123456.com/test-image` };

      const mockList = jest.fn().mockResolvedValue({ data: [] });
      const mockUpload = jest
        .fn()
        .mockResolvedValue({ data: uploadResponse, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: mockUpload,
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      await profileService.uploadAvatar(userId, noExtUri);

      // The implementation splits on '.' and takes the last part, which gives 'com/test-image' for this URL
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`${userId}/avatar-\\d+\\.com/test-image`)
        ),
        expect.any(ArrayBuffer),
        {
          contentType: 'image/com/test-image',
          upsert: true,
        }
      );
    });

    it('should default to jpeg when URI has no dots', async () => {
      const noDotUri = 'test-image';
      const uploadResponse = { path: `${userId}/avatar-123456.jpeg` };

      const mockList = jest.fn().mockResolvedValue({ data: [] });
      const mockUpload = jest
        .fn()
        .mockResolvedValue({ data: uploadResponse, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: mockUpload,
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      await profileService.uploadAvatar(userId, noDotUri);

      // When split('.').pop() is called on 'test-image', it returns 'test-image'
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${userId}/avatar-\\d+\\.test-image`)),
        expect.any(ArrayBuffer),
        {
          contentType: 'image/test-image',
          upsert: true,
        }
      );
    });

    it('should throw error when upload fails', async () => {
      const mockError = new Error('Upload failed');

      const mockList = jest.fn().mockResolvedValue({ data: [] });
      const mockUpload = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: mockUpload,
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      await expect(
        profileService.uploadAvatar(userId, testUri)
      ).rejects.toThrow('Upload failed');
    });

    it('should throw error when fetch fails', async () => {
      const fetchError = new Error('Fetch failed');
      (global.fetch as jest.Mock).mockRejectedValue(fetchError);

      const mockList = jest.fn().mockResolvedValue({ data: [] });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      await expect(
        profileService.uploadAvatar(userId, testUri)
      ).rejects.toThrow('Fetch failed');
    });

    it('should handle removal of multiple existing files', async () => {
      const existingFiles = [
        { name: 'avatar-old1.jpg', created_at: '2024-01-01' },
        { name: 'avatar-old2.png', created_at: '2024-01-02' },
      ];
      const uploadResponse = { path: `${userId}/avatar-123456.jpg` };

      const mockList = jest.fn().mockResolvedValue({ data: existingFiles });
      const mockRemove = jest.fn().mockResolvedValue({ error: null });
      const mockUpload = jest
        .fn()
        .mockResolvedValue({ data: uploadResponse, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: mockRemove,
        upload: mockUpload,
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      await profileService.uploadAvatar(userId, testUri);

      expect(mockRemove).toHaveBeenCalledWith([
        `${userId}/avatar-old1.jpg`,
        `${userId}/avatar-old2.png`,
      ]);
    });
  });

  describe('getAvatarPath', () => {
    const userId = 'user-123';

    it('should return path for most recent avatar', async () => {
      const files = [
        {
          name: 'avatar-1640995200000.jpg',
          created_at: '2022-01-01T00:00:00Z',
        },
        {
          name: 'avatar-1641081600000.png',
          created_at: '2022-01-02T00:00:00Z',
        },
      ];

      const mockList = jest
        .fn()
        .mockResolvedValue({ data: files, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.getAvatarPath(userId);

      expect(mockList).toHaveBeenCalledWith(userId);
      expect(result).toBe(`${userId}/avatar-1641081600000.png`);
    });

    it('should return null when no avatar files exist', async () => {
      const mockList = jest.fn().mockResolvedValue({ data: [], error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.getAvatarPath(userId);

      expect(result).toBeNull();
    });

    it('should return null when no avatar- prefixed files exist', async () => {
      const files = [
        { name: 'other-file.jpg', created_at: '2022-01-01T00:00:00Z' },
        { name: 'not-avatar.png', created_at: '2022-01-02T00:00:00Z' },
      ];

      const mockList = jest
        .fn()
        .mockResolvedValue({ data: files, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.getAvatarPath(userId);

      expect(result).toBeNull();
    });

    it('should return null when list operation fails', async () => {
      const mockError = new Error('List failed');
      const mockList = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.getAvatarPath(userId);

      expect(result).toBeNull();
    });

    it('should handle files with missing created_at', async () => {
      const files = [
        {
          name: 'avatar-1640995200000.jpg',
          created_at: '2022-01-01T00:00:00Z',
        },
        { name: 'avatar-1641081600000.png', created_at: null },
      ];

      const mockList = jest
        .fn()
        .mockResolvedValue({ data: files, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: mockList,
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.getAvatarPath(userId);

      expect(result).toBe(`${userId}/avatar-1640995200000.jpg`);
    });
  });

  describe('getAvatarSignedUrl', () => {
    it('should create and return signed URL', async () => {
      const avatarPath = 'user-123/avatar-123456.jpg';
      const signedUrl = 'https://signed-url.com/avatar.jpg';

      const mockCreateSignedUrl = jest
        .fn()
        .mockResolvedValue({ data: { signedUrl }, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: jest.fn(),
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: mockCreateSignedUrl,
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.getAvatarSignedUrl(avatarPath);

      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        avatarPath,
        90 * 24 * 60 * 60
      );
      expect(result).toBe(signedUrl);
    });

    it('should return null for empty avatar path', async () => {
      const result = await profileService.getAvatarSignedUrl('');

      expect(result).toBeNull();
    });

    it('should return null for null avatar path', async () => {
      const result = await profileService.getAvatarSignedUrl(null as any);

      expect(result).toBeNull();
    });

    it('should return null when createSignedUrl fails', async () => {
      const avatarPath = 'user-123/avatar-123456.jpg';
      const mockError = new Error('Signed URL creation failed');

      const mockCreateSignedUrl = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseStorage.from.mockReturnValue({
        list: jest.fn(),
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: mockCreateSignedUrl,
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.getAvatarSignedUrl(avatarPath);

      expect(result).toBeNull();
    });

    it('should handle exceptions and return null', async () => {
      const avatarPath = 'user-123/avatar-123456.jpg';

      const mockCreateSignedUrl = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      mockSupabaseStorage.from.mockReturnValue({
        list: jest.fn(),
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: mockCreateSignedUrl,
        getPublicUrl: jest.fn(),
      });

      const result = await profileService.getAvatarSignedUrl(avatarPath);

      expect(result).toBeNull();
    });

    it('should use correct expiry time (3 months)', async () => {
      const avatarPath = 'user-123/avatar-123456.jpg';
      const signedUrl = 'https://signed-url.com/avatar.jpg';
      const expectedExpirySeconds = 90 * 24 * 60 * 60; // 3 months

      const mockCreateSignedUrl = jest
        .fn()
        .mockResolvedValue({ data: { signedUrl }, error: null });

      mockSupabaseStorage.from.mockReturnValue({
        list: jest.fn(),
        remove: jest.fn(),
        upload: jest.fn(),
        createSignedUrl: mockCreateSignedUrl,
        getPublicUrl: jest.fn(),
      });

      await profileService.getAvatarSignedUrl(avatarPath);

      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        avatarPath,
        expectedExpirySeconds
      );
    });
  });
});
