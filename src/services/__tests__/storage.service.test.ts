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
    it('should return true when bucket is accessible', async () => {
      const mockFiles = [
        { name: 'avatar1.jpg', id: 'id1', updated_at: '2024-01-01' },
        { name: 'avatar2.png', id: 'id2', updated_at: '2024-01-02' },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: mockFiles, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.testAvatarsBucket();

      expect(mockFrom).toHaveBeenCalledWith('avatars');
      expect(result).toBe(true);
    });

    it('should return false when storage error occurs', async () => {
      const mockError = new Error('Storage error');
      const mockFrom = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.testAvatarsBucket();

      expect(result).toBe(false);
    });

    it('should return false when exception is thrown', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        list: jest.fn().mockRejectedValue(new Error('Network error')),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.testAvatarsBucket();

      expect(result).toBe(false);
    });

    it('should return true with empty bucket', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.testAvatarsBucket();

      expect(result).toBe(true);
    });
  });

  describe('listFiles', () => {
    it('should list files in bucket without path', async () => {
      const mockFiles = [
        { name: 'file1.jpg', id: 'id1', updated_at: '2024-01-01' },
        { name: 'file2.png', id: 'id2', updated_at: '2024-01-02' },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: mockFiles, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.listFiles('test-bucket');

      expect(mockFrom).toHaveBeenCalledWith('test-bucket');
      expect(mockFrom().list).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockFiles);
    });

    it('should list files in bucket with specific path', async () => {
      const mockFiles = [
        { name: 'avatar1.jpg', id: 'id1', updated_at: '2024-01-01' },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: mockFiles, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.listFiles('avatars', 'user123');

      expect(mockFrom).toHaveBeenCalledWith('avatars');
      expect(mockFrom().list).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockFiles);
    });

    it('should throw error when list operation fails', async () => {
      const mockError = new Error('List failed');

      const mockFrom = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });
      mockSupabaseStorage.from = mockFrom;

      await expect(storageService.listFiles('test-bucket')).rejects.toThrow(
        'List failed'
      );
    });

    it('should handle empty bucket', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.listFiles('empty-bucket');

      expect(result).toEqual([]);
    });
  });

  describe('uploadFile', () => {
    it('should upload file with default options', async () => {
      const mockFile = new ArrayBuffer(1024);
      const mockUploadData = { path: 'test-bucket/file.jpg' };

      const mockFrom = jest.fn().mockReturnValue({
        upload: jest
          .fn()
          .mockResolvedValue({ data: mockUploadData, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.uploadFile(
        'test-bucket',
        'file.jpg',
        mockFile
      );

      expect(mockFrom).toHaveBeenCalledWith('test-bucket');
      expect(mockFrom().upload).toHaveBeenCalledWith(
        'file.jpg',
        mockFile,
        undefined
      );
      expect(result).toEqual(mockUploadData);
    });

    it('should upload file with custom options', async () => {
      const mockFile = new Blob(['test'], { type: 'image/jpeg' });
      const mockUploadData = { path: 'avatars/user123/avatar.jpg' };
      const options = {
        contentType: 'image/jpeg',
        upsert: true,
      };

      const mockFrom = jest.fn().mockReturnValue({
        upload: jest
          .fn()
          .mockResolvedValue({ data: mockUploadData, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.uploadFile(
        'avatars',
        'user123/avatar.jpg',
        mockFile,
        options
      );

      expect(mockFrom().upload).toHaveBeenCalledWith(
        'user123/avatar.jpg',
        mockFile,
        options
      );
      expect(result).toEqual(mockUploadData);
    });

    it('should throw error when upload fails', async () => {
      const mockFile = new ArrayBuffer(1024);
      const mockError = new Error('Upload failed');

      const mockFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });
      mockSupabaseStorage.from = mockFrom;

      await expect(
        storageService.uploadFile('test-bucket', 'file.jpg', mockFile)
      ).rejects.toThrow('Upload failed');
    });

    it('should handle different file types', async () => {
      const mockFile = new ArrayBuffer(2048);
      const mockUploadData = { path: 'documents/file.pdf' };

      const mockFrom = jest.fn().mockReturnValue({
        upload: jest
          .fn()
          .mockResolvedValue({ data: mockUploadData, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const options = {
        contentType: 'application/pdf',
        upsert: false,
      };

      const result = await storageService.uploadFile(
        'documents',
        'file.pdf',
        mockFile,
        options
      );

      expect(mockFrom().upload).toHaveBeenCalledWith(
        'file.pdf',
        mockFile,
        options
      );
      expect(result).toEqual(mockUploadData);
    });
  });

  describe('removeFiles', () => {
    it('should remove single file', async () => {
      const mockRemoveData = [{ name: 'file1.jpg' }];

      const mockFrom = jest.fn().mockReturnValue({
        remove: jest
          .fn()
          .mockResolvedValue({ data: mockRemoveData, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.removeFiles('test-bucket', [
        'file1.jpg',
      ]);

      expect(mockFrom).toHaveBeenCalledWith('test-bucket');
      expect(mockFrom().remove).toHaveBeenCalledWith(['file1.jpg']);
      expect(result).toEqual(mockRemoveData);
    });

    it('should remove multiple files', async () => {
      const filePaths = ['user123/avatar1.jpg', 'user123/avatar2.png'];
      const mockRemoveData = [
        { name: 'avatar1.jpg' },
        { name: 'avatar2.png' },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        remove: jest
          .fn()
          .mockResolvedValue({ data: mockRemoveData, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.removeFiles('avatars', filePaths);

      expect(mockFrom().remove).toHaveBeenCalledWith(filePaths);
      expect(result).toEqual(mockRemoveData);
    });

    it('should throw error when remove operation fails', async () => {
      const mockError = new Error('Remove failed');

      const mockFrom = jest.fn().mockReturnValue({
        remove: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });
      mockSupabaseStorage.from = mockFrom;

      await expect(
        storageService.removeFiles('test-bucket', ['file1.jpg'])
      ).rejects.toThrow('Remove failed');
    });

    it('should handle empty file paths array', async () => {
      const mockRemoveData: { name: string }[] = [];

      const mockFrom = jest.fn().mockReturnValue({
        remove: jest
          .fn()
          .mockResolvedValue({ data: mockRemoveData, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.removeFiles('test-bucket', []);

      expect(mockFrom().remove).toHaveBeenCalledWith([]);
      expect(result).toEqual(mockRemoveData);
    });
  });

  describe('createSignedUrl', () => {
    it('should create signed URL with expiry time', async () => {
      const signedUrl = 'https://signed-url.com/file.jpg?token=abc123';
      const expiresIn = 3600; // 1 hour

      const mockFrom = jest.fn().mockReturnValue({
        createSignedUrl: jest
          .fn()
          .mockResolvedValue({ data: { signedUrl }, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.createSignedUrl(
        'avatars',
        'user123/avatar.jpg',
        expiresIn
      );

      expect(mockFrom).toHaveBeenCalledWith('avatars');
      expect(mockFrom().createSignedUrl).toHaveBeenCalledWith(
        'user123/avatar.jpg',
        expiresIn
      );
      expect(result).toBe(signedUrl);
    });

    it('should handle different expiry times', async () => {
      const signedUrl = 'https://signed-url.com/document.pdf?token=xyz789';
      const expiresIn = 86400; // 24 hours

      const mockFrom = jest.fn().mockReturnValue({
        createSignedUrl: jest
          .fn()
          .mockResolvedValue({ data: { signedUrl }, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.createSignedUrl(
        'documents',
        'important/document.pdf',
        expiresIn
      );

      expect(mockFrom().createSignedUrl).toHaveBeenCalledWith(
        'important/document.pdf',
        expiresIn
      );
      expect(result).toBe(signedUrl);
    });

    it('should throw error when signed URL creation fails', async () => {
      const mockError = new Error('Signed URL creation failed');

      const mockFrom = jest.fn().mockReturnValue({
        createSignedUrl: jest
          .fn()
          .mockResolvedValue({ data: null, error: mockError }),
      });
      mockSupabaseStorage.from = mockFrom;

      await expect(
        storageService.createSignedUrl('test-bucket', 'file.jpg', 3600)
      ).rejects.toThrow('Signed URL creation failed');
    });

    it('should handle zero expiry time', async () => {
      const signedUrl = 'https://signed-url.com/temp-file.jpg?token=temp123';

      const mockFrom = jest.fn().mockReturnValue({
        createSignedUrl: jest
          .fn()
          .mockResolvedValue({ data: { signedUrl }, error: null }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = await storageService.createSignedUrl(
        'temp',
        'temp-file.jpg',
        0
      );

      expect(mockFrom().createSignedUrl).toHaveBeenCalledWith('temp-file.jpg', 0);
      expect(result).toBe(signedUrl);
    });
  });

  describe('getPublicUrl', () => {
    it('should get public URL for file', () => {
      const publicUrl = 'https://public-url.com/avatars/user123/avatar.jpg';

      const mockFrom = jest.fn().mockReturnValue({
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl } }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = storageService.getPublicUrl('avatars', 'user123/avatar.jpg');

      expect(mockFrom).toHaveBeenCalledWith('avatars');
      expect(mockFrom().getPublicUrl).toHaveBeenCalledWith('user123/avatar.jpg');
      expect(result).toBe(publicUrl);
    });

    it('should handle different bucket and path combinations', () => {
      const publicUrl = 'https://public-url.com/documents/folder/file.pdf';

      const mockFrom = jest.fn().mockReturnValue({
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl } }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = storageService.getPublicUrl('documents', 'folder/file.pdf');

      expect(result).toBe(publicUrl);
    });

    it('should handle root level files', () => {
      const publicUrl = 'https://public-url.com/images/logo.png';

      const mockFrom = jest.fn().mockReturnValue({
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl } }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = storageService.getPublicUrl('images', 'logo.png');

      expect(mockFrom().getPublicUrl).toHaveBeenCalledWith('logo.png');
      expect(result).toBe(publicUrl);
    });

    it('should handle special characters in paths', () => {
      const publicUrl = 'https://public-url.com/files/user%20files/file%20name.txt';

      const mockFrom = jest.fn().mockReturnValue({
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl } }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = storageService.getPublicUrl('files', 'user files/file name.txt');

      expect(mockFrom().getPublicUrl).toHaveBeenCalledWith('user files/file name.txt');
      expect(result).toBe(publicUrl);
    });

    it('should handle empty path', () => {
      const publicUrl = 'https://public-url.com/bucket/';

      const mockFrom = jest.fn().mockReturnValue({
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl } }),
      });
      mockSupabaseStorage.from = mockFrom;

      const result = storageService.getPublicUrl('bucket', '');

      expect(mockFrom().getPublicUrl).toHaveBeenCalledWith('');
      expect(result).toBe(publicUrl);
    });
  });
});
