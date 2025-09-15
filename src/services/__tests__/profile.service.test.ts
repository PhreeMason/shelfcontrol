import { profileService, AppleProfileData, UpdateProfileParams } from '../profile.service';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
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
      const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await profileService.getProfile('user-123');

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile fetch fails', async () => {
      const mockError = new Error('Profile not found');
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await profileService.getProfile('user-123');

      expect(result).toBeNull();
    });

    it('should return null when no data is returned', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
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
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await profileService.updateProfile(profileId, updates);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('id', profileId);
      expect(mockSelect).toHaveBeenCalledWith();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should throw error when update fails', async () => {
      const profileId = 'user-123';
      const updates: UpdateProfileParams = { first_name: 'Jane' };
      const mockError = new Error('Update failed');

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(profileService.updateProfile(profileId, updates)).rejects.toThrow('Update failed');
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
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
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
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await profileService.updateProfileFromApple(userId, appleData);

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
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await profileService.updateProfileFromApple(userId, appleData);

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
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await profileService.updateProfileFromApple(userId, appleData);

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
      const mockSingle = jest.fn().mockResolvedValue({ data: mockExistingProfile, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await profileService.updateProfileFromApple(userId, appleData);

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
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(profileService.updateProfileFromApple(userId, appleData)).rejects.toThrow('Update failed');
    });
  });

});