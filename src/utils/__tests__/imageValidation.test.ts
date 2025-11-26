import * as ImagePicker from 'expo-image-picker';
import {
  getFileSizeOrDefault,
  validateImageResult,
  validateImageSize,
} from '../imageValidation';

describe('imageValidation', () => {
  describe('getFileSizeOrDefault', () => {
    it('should return file size when provided', () => {
      expect(getFileSizeOrDefault(1024)).toBe(1024);
      expect(getFileSizeOrDefault(5242880)).toBe(5242880);
      expect(getFileSizeOrDefault(0)).toBe(0);
    });

    it('should return 0 when file size is undefined', () => {
      expect(getFileSizeOrDefault(undefined)).toBe(0);
    });

    it('should return 0 when file size is null (coerced to 0)', () => {
      expect(getFileSizeOrDefault(null as unknown as undefined)).toBe(0);
    });
  });

  describe('validateImageSize', () => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    it('should return true when file size is within limit', () => {
      expect(validateImageSize(0, MAX_SIZE)).toBe(true);
      expect(validateImageSize(1024, MAX_SIZE)).toBe(true);
      expect(validateImageSize(2 * 1024 * 1024, MAX_SIZE)).toBe(true);
      expect(validateImageSize(MAX_SIZE, MAX_SIZE)).toBe(true); // Exactly at limit
    });

    it('should return false when file size exceeds limit', () => {
      expect(validateImageSize(MAX_SIZE + 1, MAX_SIZE)).toBe(false);
      expect(validateImageSize(6 * 1024 * 1024, MAX_SIZE)).toBe(false);
      expect(validateImageSize(10 * 1024 * 1024, MAX_SIZE)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateImageSize(0, 0)).toBe(true); // Both zero
      expect(validateImageSize(1, 0)).toBe(false); // Any size over zero limit
    });
  });

  describe('validateImageResult', () => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    describe('successful validation', () => {
      it('should return valid result for image under size limit', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: 'file://test.jpg',
              width: 800,
              height: 600,
              fileSize: 2 * 1024 * 1024, // 2MB
              assetId: null,
              fileName: 'test.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            },
          ],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: true,
          uri: 'file://test.jpg',
        });
      });

      it('should return valid result for image exactly at size limit', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: 'file://test.jpg',
              width: 800,
              height: 600,
              fileSize: MAX_FILE_SIZE,
              assetId: null,
              fileName: 'test.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            },
          ],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: true,
          uri: 'file://test.jpg',
        });
      });

      it('should return valid result when fileSize is undefined', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: 'file://test.jpg',
              width: 800,
              height: 600,
              assetId: null,
              fileName: 'test.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            } as ImagePicker.ImagePickerAsset,
          ],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: true,
          uri: 'file://test.jpg',
        });
      });
    });

    describe('selection canceled', () => {
      it('should return error when user cancels selection', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: true,
          assets: null,
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: false,
          error: {
            type: 'SELECTION_CANCELED',
            message: 'Image selection was canceled.',
          },
        });
      });

      it('should return error when canceled is true even with assets', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: true,
          assets: null,
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: false,
          error: {
            type: 'SELECTION_CANCELED',
            message: 'Image selection was canceled.',
          },
        });
      });
    });

    describe('invalid format errors', () => {
      it('should return error when assets array is empty', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: false,
          error: {
            type: 'INVALID_FORMAT',
            message: 'No image was selected.',
          },
        });
      });

      it('should return error when assets is undefined', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: undefined as unknown as ImagePicker.ImagePickerAsset[],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: false,
          error: {
            type: 'INVALID_FORMAT',
            message: 'No image was selected.',
          },
        });
      });

      it('should return error when asset has no URI', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: '',
              width: 800,
              height: 600,
              assetId: null,
              fileName: 'test.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            },
          ],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: false,
          error: {
            type: 'INVALID_FORMAT',
            message: 'Selected image has no URI.',
          },
        });
      });
    });

    describe('file too large errors', () => {
      it('should return error when file size exceeds limit', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: 'file://test.jpg',
              width: 800,
              height: 600,
              fileSize: 6 * 1024 * 1024, // 6MB (over limit)
              assetId: null,
              fileName: 'test.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            },
          ],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: false,
          error: {
            type: 'FILE_TOO_LARGE',
            message: 'Please select an image smaller than 5MB.',
          },
        });
      });

      it('should return error when file size is just over limit', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: 'file://test.jpg',
              width: 800,
              height: 600,
              fileSize: MAX_FILE_SIZE + 1,
              assetId: null,
              fileName: 'test.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            },
          ],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: false,
          error: {
            type: 'FILE_TOO_LARGE',
            message: 'Please select an image smaller than 5MB.',
          },
        });
      });
    });

    describe('edge cases', () => {
      it('should handle different URI formats', () => {
        const uris = [
          'file://path/to/image.jpg',
          'content://media/external/images/123',
          'data:image/jpeg;base64,/9j/4AAQ...',
          'https://example.com/image.jpg',
        ];

        uris.forEach(uri => {
          const result: ImagePicker.ImagePickerResult = {
            canceled: false,
            assets: [
              {
                uri,
                width: 800,
                height: 600,
                fileSize: 1024,
                assetId: null,
                fileName: 'test.jpg',
                type: 'image',
                duration: null,
                base64: null,
                exif: null,
                mimeType: 'image/jpeg',
              },
            ],
          };

          const validation = validateImageResult(result, MAX_FILE_SIZE);

          expect(validation).toEqual({
            valid: true,
            uri,
          });
        });
      });

      it('should handle zero file size', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: 'file://test.jpg',
              width: 800,
              height: 600,
              fileSize: 0,
              assetId: null,
              fileName: 'test.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            },
          ],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        expect(validation).toEqual({
          valid: true,
          uri: 'file://test.jpg',
        });
      });

      it('should only validate first asset when multiple assets present', () => {
        const result: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [
            {
              uri: 'file://test1.jpg',
              width: 800,
              height: 600,
              fileSize: 1024,
              assetId: null,
              fileName: 'test1.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            },
            {
              uri: 'file://test2.jpg',
              width: 800,
              height: 600,
              fileSize: 2048,
              assetId: null,
              fileName: 'test2.jpg',
              type: 'image',
              duration: null,
              base64: null,
              exif: null,
              mimeType: 'image/jpeg',
            },
          ],
        };

        const validation = validateImageResult(result, MAX_FILE_SIZE);

        // Should use first asset only
        expect(validation).toEqual({
          valid: true,
          uri: 'file://test1.jpg',
        });
      });
    });
  });
});
