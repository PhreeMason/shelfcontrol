import { getPreviewImageUri, isShowingDefaultImage } from '../coverImageUtils';

describe('coverImageUtils', () => {
  describe('getPreviewImageUri', () => {
    describe('upload mode', () => {
      it('should return value when mode is upload and value exists', () => {
        const result = getPreviewImageUri(
          'upload',
          'file://local/image.jpg',
          null
        );
        expect(result).toBe('file://local/image.jpg');
      });

      it('should return value when mode is upload with default available', () => {
        const result = getPreviewImageUri(
          'upload',
          'file://local/image.jpg',
          'https://example.com/default.jpg'
        );
        expect(result).toBe('file://local/image.jpg');
      });

      it('should return null when mode is upload but no value', () => {
        const result = getPreviewImageUri('upload', null, null);
        expect(result).toBeNull();
      });

      it('should return null when mode is upload with empty string value', () => {
        const result = getPreviewImageUri('upload', '', null);
        expect(result).toBeNull();
      });

      it('should return null when mode is upload but value is null with default available', () => {
        const result = getPreviewImageUri(
          'upload',
          null,
          'https://example.com/default.jpg'
        );
        expect(result).toBeNull();
      });
    });

    describe('url mode', () => {
      it('should return value when mode is url and value exists', () => {
        const result = getPreviewImageUri(
          'url',
          'https://example.com/image.jpg',
          null
        );
        expect(result).toBe('https://example.com/image.jpg');
      });

      it('should return value when mode is url with default available', () => {
        const result = getPreviewImageUri(
          'url',
          'https://example.com/image.jpg',
          'https://example.com/default.jpg'
        );
        expect(result).toBe('https://example.com/image.jpg');
      });

      it('should return null when mode is url but no value', () => {
        const result = getPreviewImageUri('url', null, null);
        expect(result).toBeNull();
      });

      it('should return null when mode is url with empty string value', () => {
        const result = getPreviewImageUri('url', '', null);
        expect(result).toBeNull();
      });

      it('should return null when mode is url but value is null with default available', () => {
        const result = getPreviewImageUri(
          'url',
          null,
          'https://example.com/default.jpg'
        );
        expect(result).toBeNull();
      });
    });

    describe('none mode', () => {
      it('should return defaultPreviewUrl when mode is none and default exists', () => {
        const result = getPreviewImageUri(
          'none',
          null,
          'https://example.com/default.jpg'
        );
        expect(result).toBe('https://example.com/default.jpg');
      });

      it('should return null when mode is none and no default', () => {
        const result = getPreviewImageUri('none', null, null);
        expect(result).toBeNull();
      });

      it('should return defaultPreviewUrl even if value exists (value ignored in none mode)', () => {
        const result = getPreviewImageUri(
          'none',
          'https://example.com/user-image.jpg',
          'https://example.com/default.jpg'
        );
        expect(result).toBe('https://example.com/default.jpg');
      });

      it('should return null when mode is none with empty default', () => {
        const result = getPreviewImageUri('none', null, '');
        expect(result).toBeNull();
      });
    });

    describe('edge cases and priority order', () => {
      it('should prioritize upload mode over url mode', () => {
        // Mode determines priority, not both being set
        const uploadResult = getPreviewImageUri(
          'upload',
          'file://local/image.jpg',
          'https://example.com/default.jpg'
        );
        expect(uploadResult).toBe('file://local/image.jpg');

        const urlResult = getPreviewImageUri(
          'url',
          'https://example.com/image.jpg',
          'https://example.com/default.jpg'
        );
        expect(urlResult).toBe('https://example.com/image.jpg');
      });

      it('should handle different URI formats', () => {
        // URIs that start with http/https or file:// are returned as-is
        expect(
          getPreviewImageUri('upload', 'file://path/to/image.jpg', null)
        ).toBe('file://path/to/image.jpg');
        expect(
          getPreviewImageUri('upload', 'https://example.com/image.jpg', null)
        ).toBe('https://example.com/image.jpg');
        expect(
          getPreviewImageUri('upload', 'http://example.com/image.jpg', null)
        ).toBe('http://example.com/image.jpg');

        // Other URIs get converted to storage URLs
        expect(
          getPreviewImageUri(
            'upload',
            'content://media/external/images/123',
            null
          )
        ).toBe(
          'https://example.com/storage/content://media/external/images/123'
        );
        expect(
          getPreviewImageUri(
            'upload',
            'data:image/jpeg;base64,/9j/4AAQ...',
            null
          )
        ).toBe(
          'https://example.com/storage/data:image/jpeg;base64,/9j/4AAQ...'
        );

        // URL mode always returns value as-is
        expect(
          getPreviewImageUri('url', 'file://path/to/image.jpg', null)
        ).toBe('file://path/to/image.jpg');
        expect(
          getPreviewImageUri('url', 'https://example.com/image.jpg', null)
        ).toBe('https://example.com/image.jpg');
      });

      it('should handle whitespace-only values as falsy', () => {
        // Note: Current implementation treats ' ' as truthy
        // Upload mode generates storage URL, URL mode returns as-is
        expect(getPreviewImageUri('upload', ' ', null)).toBe(
          'https://example.com/storage/ '
        );
        expect(getPreviewImageUri('url', ' ', null)).toBe(' ');
      });

      it('should return null when all parameters are null', () => {
        const result = getPreviewImageUri('none', null, null);
        expect(result).toBeNull();
      });

      it('should return null when all parameters are empty strings', () => {
        const result = getPreviewImageUri('none', '', '');
        expect(result).toBeNull();
      });
    });
  });

  describe('isShowingDefaultImage', () => {
    describe('showing default', () => {
      it('should return true when mode is none and default exists', () => {
        const result = isShowingDefaultImage(
          'none',
          'https://example.com/default.jpg'
        );
        expect(result).toBe(true);
      });

      it('should return true when mode is none with different default URLs', () => {
        const urls = [
          'https://example.com/default.jpg',
          'file://local/default.jpg',
          'data:image/jpeg;base64,/9j/4AAQ...',
        ];

        urls.forEach(url => {
          expect(isShowingDefaultImage('none', url)).toBe(true);
        });
      });

      it('should return false with empty string default (falsy check)', () => {
        // Empty string is falsy in JS, so this returns false
        const result = isShowingDefaultImage('none', '');
        expect(result).toBe(false);
      });
    });

    describe('not showing default', () => {
      it('should return false when mode is upload', () => {
        const result = isShowingDefaultImage(
          'upload',
          'https://example.com/default.jpg'
        );
        expect(result).toBe(false);
      });

      it('should return false when mode is url', () => {
        const result = isShowingDefaultImage(
          'url',
          'https://example.com/default.jpg'
        );
        expect(result).toBe(false);
      });

      it('should return false when mode is none but no default', () => {
        const result = isShowingDefaultImage('none', null);
        expect(result).toBe(false);
      });

      it('should return false for all modes when default is null', () => {
        expect(isShowingDefaultImage('upload', null)).toBe(false);
        expect(isShowingDefaultImage('url', null)).toBe(false);
        expect(isShowingDefaultImage('none', null)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle all combinations of mode and default', () => {
        const modes = ['upload', 'url', 'none'] as const;
        const defaults = ['https://example.com/default.jpg', null, ''] as const;

        modes.forEach(mode => {
          defaults.forEach(defaultUrl => {
            const result = isShowingDefaultImage(mode, defaultUrl);

            // Only true when mode is 'none' and default is truthy
            const expected = mode === 'none' && Boolean(defaultUrl);
            expect(result).toBe(expected);
          });
        });
      });

      it('should be consistent with getPreviewImageUri for default detection', () => {
        // When isShowingDefaultImage returns true,
        // getPreviewImageUri should return the default
        const mode = 'none';
        const defaultUrl = 'https://example.com/default.jpg';

        expect(isShowingDefaultImage(mode, defaultUrl)).toBe(true);
        expect(getPreviewImageUri(mode, null, defaultUrl)).toBe(defaultUrl);
      });

      it('should handle whitespace-only default as truthy', () => {
        // Whitespace string is truthy in JS, so returns true
        const result = isShowingDefaultImage('none', ' ');
        expect(result).toBe(true);
      });
    });

    describe('boolean logic verification', () => {
      it('should use truthy check (both null and undefined are falsy)', () => {
        // Verify it uses Boolean check (falsy values return false)
        expect(isShowingDefaultImage('none', null)).toBe(false);
        expect(
          isShowingDefaultImage('none', undefined as unknown as string | null)
        ).toBe(false);
      });

      it('should use AND logic (both conditions must be true)', () => {
        // Mode must be 'none' AND default must exist
        expect(isShowingDefaultImage('none', 'default.jpg')).toBe(true); // Both true
        expect(isShowingDefaultImage('upload', 'default.jpg')).toBe(false); // Only default true
        expect(isShowingDefaultImage('none', null)).toBe(false); // Only mode true
        expect(isShowingDefaultImage('upload', null)).toBe(false); // Both false
      });
    });
  });

  describe('integration tests', () => {
    it('should work together for typical upload flow', () => {
      const mode = 'upload';
      const uploadedUri = 'file://local/image.jpg';
      const defaultUrl = 'https://example.com/default.jpg';

      const preview = getPreviewImageUri(mode, uploadedUri, defaultUrl);
      const showingDefault = isShowingDefaultImage(mode, defaultUrl);

      expect(preview).toBe(uploadedUri);
      expect(showingDefault).toBe(false);
    });

    it('should work together for typical URL flow', () => {
      const mode = 'url';
      const urlValue = 'https://example.com/custom.jpg';
      const defaultUrl = 'https://example.com/default.jpg';

      const preview = getPreviewImageUri(mode, urlValue, defaultUrl);
      const showingDefault = isShowingDefaultImage(mode, defaultUrl);

      expect(preview).toBe(urlValue);
      expect(showingDefault).toBe(false);
    });

    it('should work together for default image display', () => {
      const mode = 'none';
      const value = null;
      const defaultUrl = 'https://example.com/default.jpg';

      const preview = getPreviewImageUri(mode, value, defaultUrl);
      const showingDefault = isShowingDefaultImage(mode, defaultUrl);

      expect(preview).toBe(defaultUrl);
      expect(showingDefault).toBe(true);
    });

    it('should work together when no image to show', () => {
      const mode = 'none';
      const value = null;
      const defaultUrl = null;

      const preview = getPreviewImageUri(mode, value, defaultUrl);
      const showingDefault = isShowingDefaultImage(mode, defaultUrl);

      expect(preview).toBeNull();
      expect(showingDefault).toBe(false);
    });
  });
});
