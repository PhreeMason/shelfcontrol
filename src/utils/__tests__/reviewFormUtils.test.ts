import {
  extractCategorizedPlatforms,
  getReviewFormDefaults,
  createPlatformToggleHandler,
  prepareSelectedPlatforms,
  prepareReviewTrackingParams,
  validatePlatformSelection,
  shouldSetDefaultDate,
  getDefaultReviewDueDate,
  shouldClearReviewDueDate,
  createCustomPlatformHandler,
  createRemovePlatformHandler,
  shouldSetDefaultBlog,
  createReviewTrackingSuccessToast,
  createReviewTrackingErrorToast,
  createPlatformRequiredToast,
  createSkipSuccessToast,
  createSkipErrorToast,
} from '../reviewFormUtils';

describe('reviewFormUtils', () => {
  describe('extractCategorizedPlatforms', () => {
    it('should categorize used preset platforms', () => {
      const userPlatforms = ['NetGalley', 'Goodreads', 'Amazon'];
      const result = extractCategorizedPlatforms(userPlatforms);

      expect(result.usedPresets).toEqual(['NetGalley', 'Goodreads', 'Amazon']);
      expect(result.unusedPresets).toContain('Instagram');
      expect(result.unusedPresets).toContain('TikTok');
      expect(result.custom).toEqual([]);
      expect(result.blogs).toEqual([]);
    });

    it('should categorize custom platforms', () => {
      const userPlatforms = ['MyBlog', 'CustomPlatform'];
      const result = extractCategorizedPlatforms(userPlatforms);

      expect(result.usedPresets).toEqual([]);
      expect(result.custom).toEqual(['MyBlog', 'CustomPlatform']);
      expect(result.blogs).toEqual([]);
    });

    it('should extract blog URLs', () => {
      const userPlatforms = [
        'Blog: https://myblog.com',
        'Blog: https://anotherblog.com',
      ];
      const result = extractCategorizedPlatforms(userPlatforms);

      expect(result.blogs).toEqual([
        'https://myblog.com',
        'https://anotherblog.com',
      ]);
      expect(result.usedPresets).toEqual([]);
      expect(result.custom).toEqual([]);
    });

    it('should handle mixed platform types', () => {
      const userPlatforms = [
        'NetGalley',
        'Blog: https://myblog.com',
        'CustomPlatform',
        'Goodreads',
      ];
      const result = extractCategorizedPlatforms(userPlatforms);

      expect(result.usedPresets).toEqual(['NetGalley', 'Goodreads']);
      expect(result.blogs).toEqual(['https://myblog.com']);
      expect(result.custom).toEqual(['CustomPlatform']);
    });

    it('should handle empty array', () => {
      const result = extractCategorizedPlatforms([]);

      expect(result.usedPresets).toEqual([]);
      expect(result.unusedPresets).toHaveLength(8);
      expect(result.custom).toEqual([]);
      expect(result.blogs).toEqual([]);
    });

    it('should handle duplicate platforms', () => {
      const userPlatforms = [
        'NetGalley',
        'NetGalley',
        'CustomPlatform',
        'CustomPlatform',
      ];
      const result = extractCategorizedPlatforms(userPlatforms);

      expect(result.usedPresets).toEqual(['NetGalley']);
      expect(result.custom).toEqual(['CustomPlatform']);
    });

    it('should handle duplicate blog URLs', () => {
      const userPlatforms = [
        'Blog: https://myblog.com',
        'Blog: https://myblog.com',
      ];
      const result = extractCategorizedPlatforms(userPlatforms);

      expect(result.blogs).toEqual(['https://myblog.com']);
    });

    it('should return all presets as unused when none are used', () => {
      const userPlatforms = ['CustomPlatform'];
      const result = extractCategorizedPlatforms(userPlatforms);

      expect(result.unusedPresets).toEqual([
        'NetGalley',
        'Goodreads',
        'Amazon',
        'Instagram',
        'TikTok',
        'Twitter/X',
        'Facebook',
        'YouTube',
      ]);
    });
  });

  describe('getReviewFormDefaults', () => {
    it('should return NetGalley defaults', () => {
      const result = getReviewFormDefaults('NetGalley');

      expect(result.platforms.has('NetGalley')).toBe(true);
      expect(result.platforms.has('Goodreads')).toBe(true);
      expect(result.platforms.size).toBe(2);
      expect(result.hasReviewDeadline).toBe(true);
      expect(result.reviewDueDate).toBeInstanceOf(Date);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);
      const actualDate = result.reviewDueDate!;
      expect(actualDate.getDate()).toBe(expectedDate.getDate());
    });

    it('should return Publisher ARC defaults', () => {
      const result = getReviewFormDefaults('Publisher ARC');

      expect(result.platforms.has('Goodreads')).toBe(true);
      expect(result.platforms.size).toBe(1);
      expect(result.hasReviewDeadline).toBe(true);
      expect(result.reviewDueDate).toBeInstanceOf(Date);
    });

    it('should return empty defaults for other sources', () => {
      const result = getReviewFormDefaults('Personal');

      expect(result.platforms.size).toBe(0);
      expect(result.hasReviewDeadline).toBe(false);
      expect(result.reviewDueDate).toBeNull();
    });

    it('should return empty defaults for empty string', () => {
      const result = getReviewFormDefaults('');

      expect(result.platforms.size).toBe(0);
      expect(result.hasReviewDeadline).toBe(false);
      expect(result.reviewDueDate).toBeNull();
    });
  });

  describe('createPlatformToggleHandler', () => {
    it('should add platform when not selected', () => {
      const selectedPlatforms = new Set<string>(['NetGalley']);
      const setSelectedPlatforms = jest.fn();

      const toggleHandler = createPlatformToggleHandler(
        selectedPlatforms,
        setSelectedPlatforms
      );

      toggleHandler('Goodreads');

      expect(setSelectedPlatforms).toHaveBeenCalledWith(
        new Set(['NetGalley', 'Goodreads'])
      );
    });

    it('should remove platform when already selected', () => {
      const selectedPlatforms = new Set<string>(['NetGalley', 'Goodreads']);
      const setSelectedPlatforms = jest.fn();

      const toggleHandler = createPlatformToggleHandler(
        selectedPlatforms,
        setSelectedPlatforms
      );

      toggleHandler('NetGalley');

      expect(setSelectedPlatforms).toHaveBeenCalledWith(new Set(['Goodreads']));
    });

    it('should handle empty set', () => {
      const selectedPlatforms = new Set<string>();
      const setSelectedPlatforms = jest.fn();

      const toggleHandler = createPlatformToggleHandler(
        selectedPlatforms,
        setSelectedPlatforms
      );

      toggleHandler('NetGalley');

      expect(setSelectedPlatforms).toHaveBeenCalledWith(new Set(['NetGalley']));
    });
  });

  describe('prepareSelectedPlatforms', () => {
    it('should combine all platform types', () => {
      const selectedPlatforms = new Set(['NetGalley', 'Goodreads']);
      const hasBlog = true;
      const blogUrl = 'https://myblog.com';
      const customPlatforms = ['CustomPlatform1', 'CustomPlatform2'];

      const result = prepareSelectedPlatforms(
        selectedPlatforms,
        hasBlog,
        blogUrl,
        customPlatforms
      );

      expect(result).toEqual([
        'NetGalley',
        'Goodreads',
        'Blog: https://myblog.com',
        'CustomPlatform1',
        'CustomPlatform2',
      ]);
    });

    it('should include blog when hasBlog is true', () => {
      const selectedPlatforms = new Set(['NetGalley']);
      const hasBlog = true;
      const blogUrl = 'https://myblog.com';
      const customPlatforms: string[] = [];

      const result = prepareSelectedPlatforms(
        selectedPlatforms,
        hasBlog,
        blogUrl,
        customPlatforms
      );

      expect(result).toContain('Blog: https://myblog.com');
    });

    it('should exclude blog when hasBlog is false', () => {
      const selectedPlatforms = new Set(['NetGalley']);
      const hasBlog = false;
      const blogUrl = 'https://myblog.com';
      const customPlatforms: string[] = [];

      const result = prepareSelectedPlatforms(
        selectedPlatforms,
        hasBlog,
        blogUrl,
        customPlatforms
      );

      expect(result).not.toContain('Blog: https://myblog.com');
    });

    it('should trim blog URL', () => {
      const selectedPlatforms = new Set<string>();
      const hasBlog = true;
      const blogUrl = '  https://myblog.com  ';
      const customPlatforms: string[] = [];

      const result = prepareSelectedPlatforms(
        selectedPlatforms,
        hasBlog,
        blogUrl,
        customPlatforms
      );

      expect(result).toEqual(['Blog: https://myblog.com']);
    });

    it('should exclude blog when blogUrl is empty', () => {
      const selectedPlatforms = new Set(['NetGalley']);
      const hasBlog = true;
      const blogUrl = '';
      const customPlatforms: string[] = [];

      const result = prepareSelectedPlatforms(
        selectedPlatforms,
        hasBlog,
        blogUrl,
        customPlatforms
      );

      expect(result).toEqual(['NetGalley']);
    });

    it('should exclude blog when blogUrl is only whitespace', () => {
      const selectedPlatforms = new Set(['NetGalley']);
      const hasBlog = true;
      const blogUrl = '   ';
      const customPlatforms: string[] = [];

      const result = prepareSelectedPlatforms(
        selectedPlatforms,
        hasBlog,
        blogUrl,
        customPlatforms
      );

      expect(result).toEqual(['NetGalley']);
    });
  });

  describe('prepareReviewTrackingParams', () => {
    it('should prepare params with all fields', () => {
      const deadlineId = 'deadline-123';
      const platforms = ['NetGalley', 'Goodreads'];
      const needsLinkSubmission = true;
      const reviewDueDate = new Date('2025-10-20');
      const reviewNotes = 'Great book!';

      const result = prepareReviewTrackingParams(
        deadlineId,
        platforms,
        needsLinkSubmission,
        reviewDueDate,
        reviewNotes
      );

      expect(result).toEqual({
        deadline_id: 'deadline-123',
        needs_link_submission: true,
        platforms: [{ name: 'NetGalley' }, { name: 'Goodreads' }],
        review_due_date: reviewDueDate.toISOString(),
        review_notes: 'Great book!',
      });
    });

    it('should prepare params without review due date', () => {
      const result = prepareReviewTrackingParams(
        'deadline-123',
        ['NetGalley'],
        false,
        null
      );

      expect(result.review_due_date).toBeUndefined();
    });

    it('should prepare params without review notes', () => {
      const result = prepareReviewTrackingParams(
        'deadline-123',
        ['NetGalley'],
        false,
        null
      );

      expect(result.review_notes).toBeUndefined();
    });

    it('should exclude review notes when empty string', () => {
      const result = prepareReviewTrackingParams(
        'deadline-123',
        ['NetGalley'],
        false,
        null,
        ''
      );

      expect(result.review_notes).toBeUndefined();
    });

    it('should exclude review notes when only whitespace', () => {
      const result = prepareReviewTrackingParams(
        'deadline-123',
        ['NetGalley'],
        false,
        null,
        '   '
      );

      expect(result.review_notes).toBeUndefined();
    });

    it('should handle empty platforms array', () => {
      const result = prepareReviewTrackingParams(
        'deadline-123',
        [],
        false,
        null
      );

      expect(result.platforms).toEqual([]);
    });
  });

  describe('validatePlatformSelection', () => {
    it('should return valid for non-empty array', () => {
      const result = validatePlatformSelection(['NetGalley']);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty array', () => {
      const result = validatePlatformSelection([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please select at least one platform');
    });

    it('should return valid for multiple platforms', () => {
      const result = validatePlatformSelection([
        'NetGalley',
        'Goodreads',
        'Amazon',
      ]);
      expect(result.isValid).toBe(true);
    });
  });

  describe('shouldSetDefaultDate', () => {
    it('should return true when hasReviewDeadline is true and reviewDueDate is null', () => {
      expect(shouldSetDefaultDate(true, null)).toBe(true);
    });

    it('should return false when hasReviewDeadline is false', () => {
      expect(shouldSetDefaultDate(false, null)).toBe(false);
    });

    it('should return false when reviewDueDate is set', () => {
      expect(shouldSetDefaultDate(true, new Date())).toBe(false);
    });

    it('should return false when both are false/null', () => {
      expect(shouldSetDefaultDate(false, null)).toBe(false);
    });
  });

  describe('getDefaultReviewDueDate', () => {
    it('should return date 7 days from now', () => {
      const result = getDefaultReviewDueDate();
      const expected = new Date();
      expected.setDate(expected.getDate() + 7);

      expect(result.getDate()).toBe(expected.getDate());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getFullYear()).toBe(expected.getFullYear());
    });
  });

  describe('shouldClearReviewDueDate', () => {
    it('should return true when hasReviewDeadline is false', () => {
      expect(shouldClearReviewDueDate(false)).toBe(true);
    });

    it('should return false when hasReviewDeadline is true', () => {
      expect(shouldClearReviewDueDate(true)).toBe(false);
    });
  });

  describe('createCustomPlatformHandler', () => {
    it('should add platform and clear input when platform is valid', () => {
      const newPlatform = 'MyCustomPlatform';
      const customPlatforms: string[] = [];
      const setCustomPlatforms = jest.fn();
      const clearInput = jest.fn();

      const handler = createCustomPlatformHandler(
        newPlatform,
        customPlatforms,
        setCustomPlatforms,
        clearInput
      );

      handler();

      expect(setCustomPlatforms).toHaveBeenCalledWith(['MyCustomPlatform']);
      expect(clearInput).toHaveBeenCalled();
    });

    it('should trim platform name', () => {
      const newPlatform = '  MyCustomPlatform  ';
      const customPlatforms: string[] = [];
      const setCustomPlatforms = jest.fn();
      const clearInput = jest.fn();

      const handler = createCustomPlatformHandler(
        newPlatform,
        customPlatforms,
        setCustomPlatforms,
        clearInput
      );

      handler();

      expect(setCustomPlatforms).toHaveBeenCalledWith(['MyCustomPlatform']);
    });

    it('should not add platform when input is empty', () => {
      const newPlatform = '';
      const customPlatforms: string[] = [];
      const setCustomPlatforms = jest.fn();
      const clearInput = jest.fn();

      const handler = createCustomPlatformHandler(
        newPlatform,
        customPlatforms,
        setCustomPlatforms,
        clearInput
      );

      handler();

      expect(setCustomPlatforms).not.toHaveBeenCalled();
      expect(clearInput).not.toHaveBeenCalled();
    });

    it('should not add platform when input is only whitespace', () => {
      const newPlatform = '   ';
      const customPlatforms: string[] = [];
      const setCustomPlatforms = jest.fn();
      const clearInput = jest.fn();

      const handler = createCustomPlatformHandler(
        newPlatform,
        customPlatforms,
        setCustomPlatforms,
        clearInput
      );

      handler();

      expect(setCustomPlatforms).not.toHaveBeenCalled();
      expect(clearInput).not.toHaveBeenCalled();
    });

    it('should append to existing platforms', () => {
      const newPlatform = 'Platform2';
      const customPlatforms = ['Platform1'];
      const setCustomPlatforms = jest.fn();
      const clearInput = jest.fn();

      const handler = createCustomPlatformHandler(
        newPlatform,
        customPlatforms,
        setCustomPlatforms,
        clearInput
      );

      handler();

      expect(setCustomPlatforms).toHaveBeenCalledWith([
        'Platform1',
        'Platform2',
      ]);
    });
  });

  describe('createRemovePlatformHandler', () => {
    it('should remove platform at specified index', () => {
      const customPlatforms = ['Platform1', 'Platform2', 'Platform3'];
      const setCustomPlatforms = jest.fn();

      const handler = createRemovePlatformHandler(
        customPlatforms,
        setCustomPlatforms
      );

      handler(1);

      expect(setCustomPlatforms).toHaveBeenCalledWith([
        'Platform1',
        'Platform3',
      ]);
    });

    it('should remove first platform', () => {
      const customPlatforms = ['Platform1', 'Platform2'];
      const setCustomPlatforms = jest.fn();

      const handler = createRemovePlatformHandler(
        customPlatforms,
        setCustomPlatforms
      );

      handler(0);

      expect(setCustomPlatforms).toHaveBeenCalledWith(['Platform2']);
    });

    it('should remove last platform', () => {
      const customPlatforms = ['Platform1', 'Platform2'];
      const setCustomPlatforms = jest.fn();

      const handler = createRemovePlatformHandler(
        customPlatforms,
        setCustomPlatforms
      );

      handler(1);

      expect(setCustomPlatforms).toHaveBeenCalledWith(['Platform1']);
    });

    it('should handle empty array result', () => {
      const customPlatforms = ['Platform1'];
      const setCustomPlatforms = jest.fn();

      const handler = createRemovePlatformHandler(
        customPlatforms,
        setCustomPlatforms
      );

      handler(0);

      expect(setCustomPlatforms).toHaveBeenCalledWith([]);
    });
  });

  describe('shouldSetDefaultBlog', () => {
    it('should return true when all conditions are met', () => {
      expect(shouldSetDefaultBlog(true, '', ['https://blog1.com'])).toBe(true);
    });

    it('should return false when hasBlog is false', () => {
      expect(shouldSetDefaultBlog(false, '', ['https://blog1.com'])).toBe(
        false
      );
    });

    it('should return false when blogUrl is set', () => {
      expect(
        shouldSetDefaultBlog(true, 'https://myblog.com', ['https://blog1.com'])
      ).toBe(false);
    });

    it('should return false when availableBlogs is empty', () => {
      expect(shouldSetDefaultBlog(true, '', [])).toBe(false);
    });
  });

  describe('toast creators', () => {
    describe('createReviewTrackingSuccessToast', () => {
      it('should create success toast', () => {
        const toast = createReviewTrackingSuccessToast();
        expect(toast).toEqual({
          type: 'success',
          text1: 'Review tracking set up!',
        });
      });
    });

    describe('createReviewTrackingErrorToast', () => {
      it('should create error toast with default message', () => {
        const toast = createReviewTrackingErrorToast();
        expect(toast).toEqual({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to set up review tracking. Please try again.',
        });
      });

      it('should create error toast with error message', () => {
        const error = new Error('Network error');
        const toast = createReviewTrackingErrorToast(error);
        expect(toast).toEqual({
          type: 'error',
          text1: 'Error',
          text2: 'Network error',
        });
      });
    });

    describe('createPlatformRequiredToast', () => {
      it('should create platform required toast', () => {
        const toast = createPlatformRequiredToast();
        expect(toast).toEqual({
          type: 'error',
          text1: 'Platform Required',
          text2: 'Please select at least one platform',
        });
      });
    });

    describe('createSkipSuccessToast', () => {
      it('should create skip success toast', () => {
        const toast = createSkipSuccessToast();
        expect(toast).toEqual({
          type: 'success',
          text1: 'All done!',
        });
      });
    });

    describe('createSkipErrorToast', () => {
      it('should create skip error toast with default message', () => {
        const toast = createSkipErrorToast();
        expect(toast).toEqual({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update deadline. Please try again.',
        });
      });

      it('should create skip error toast with error message', () => {
        const error = new Error('Database error');
        const toast = createSkipErrorToast(error);
        expect(toast).toEqual({
          type: 'error',
          text1: 'Error',
          text2: 'Database error',
        });
      });
    });
  });
});
