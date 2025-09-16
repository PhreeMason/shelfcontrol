import { storageService } from '../storage.service';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      listBuckets: jest.fn(),
      createBucket: jest.fn(),
      updateBucket: jest.fn(),
      from: jest.fn(() => ({
        list: jest.fn(),
        upload: jest.fn(),
        remove: jest.fn(),
        createSignedUrl: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}));

const mockSupabaseStorage = supabase.storage as jest.Mocked<
  typeof supabase.storage
>;

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupAvatarsBucket', () => {
    it('should create bucket when it does not exist', async () => {
      const mockBuckets = [
        {
          id: 'other-bucket',
          name: 'other-bucket',
          owner: '',
          created_at: '',
          updated_at: '',
          public: false,
        },
      ];

      mockSupabaseStorage.listBuckets.mockResolvedValue({
        data: mockBuckets,
        error: null,
      });

      mockSupabaseStorage.createBucket.mockResolvedValue({
        data: { name: 'avatars' } as any,
        error: null,
      });

      const result = await storageService.setupAvatarsBucket();

      expect(mockSupabaseStorage.listBuckets).toHaveBeenCalled();
      expect(mockSupabaseStorage.createBucket).toHaveBeenCalledWith('avatars', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        fileSizeLimit: 5242880,
      });
      expect(result).toEqual({
        success: true,
        data: { name: 'avatars' },
      });
    });

    it('should update bucket when it already exists', async () => {
      const mockBuckets = [
        {
          id: 'avatars',
          name: 'avatars',
          owner: '',
          created_at: '',
          updated_at: '',
          public: false,
        },
      ];

      mockSupabaseStorage.listBuckets.mockResolvedValue({
        data: mockBuckets,
        error: null,
      });

      mockSupabaseStorage.updateBucket.mockResolvedValue({
        data: { name: 'avatars' } as any,
        error: null,
      });

      const result = await storageService.setupAvatarsBucket();

      expect(mockSupabaseStorage.listBuckets).toHaveBeenCalled();
      expect(mockSupabaseStorage.createBucket).not.toHaveBeenCalled();
      expect(mockSupabaseStorage.updateBucket).toHaveBeenCalledWith('avatars', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        fileSizeLimit: 5242880,
      });
      expect(result).toEqual({
        success: true,
        data: { name: 'avatars' },
      });
    });

    it('should handle list buckets error', async () => {
      const mockError = {
        message: 'Failed to list buckets',
        __isStorageError: true,
      } as any;

      mockSupabaseStorage.listBuckets.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await storageService.setupAvatarsBucket();

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });

    it('should handle create bucket error', async () => {
      const mockBuckets = [
        {
          id: 'other-bucket',
          name: 'other-bucket',
          owner: '',
          created_at: '',
          updated_at: '',
          public: false,
        },
      ];
      const mockError = {
        message: 'Failed to create bucket',
        __isStorageError: true,
      } as any;

      mockSupabaseStorage.listBuckets.mockResolvedValue({
        data: mockBuckets,
        error: null,
      });

      mockSupabaseStorage.createBucket.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await storageService.setupAvatarsBucket();

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });

    it('should handle update bucket error', async () => {
      const mockBuckets = [
        {
          id: 'avatars',
          name: 'avatars',
          owner: '',
          created_at: '',
          updated_at: '',
          public: false,
        },
      ];
      const mockError = {
        message: 'Failed to update bucket',
        __isStorageError: true,
      } as any;

      mockSupabaseStorage.listBuckets.mockResolvedValue({
        data: mockBuckets,
        error: null,
      });

      mockSupabaseStorage.updateBucket.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await storageService.setupAvatarsBucket();

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });

    it('should handle unexpected errors', async () => {
      const mockError = new Error('Unexpected error');

      mockSupabaseStorage.listBuckets.mockRejectedValue(mockError);

      const result = await storageService.setupAvatarsBucket();

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });
  });

  describe('testAvatarsBucket', () => {
    it('should return false when error occurs', async () => {
      const result = await storageService.testAvatarsBucket();
      expect(result).toBe(false);
    });
  });
});
