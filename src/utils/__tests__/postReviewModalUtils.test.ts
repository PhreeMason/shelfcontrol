import { initializeModalState, prepareModalUpdates } from '../postReviewModalUtils';

describe('postReviewModalUtils', () => {
  describe('initializeModalState', () => {
    it('should return null when modal is not visible', () => {
      const platforms = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: true,
          posted_date: '2025-01-15',
          review_url: 'https://goodreads.com/review/123',
        },
      ];

      const result = initializeModalState(platforms, false);

      expect(result).toBeNull();
    });

    it('should return empty state for empty platforms array', () => {
      const result = initializeModalState([], true);

      expect(result).toEqual({
        selectedPlatformIds: new Set(),
        platformUrls: {},
        needsLinkSubmission: false,
      });
    });

    it('should initialize with posted platforms selected', () => {
      const platforms = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: true,
          posted_date: '2025-01-15',
          review_url: null,
        },
        {
          id: '2',
          platform_name: 'Amazon',
          posted: false,
          posted_date: null,
          review_url: null,
        },
        {
          id: '3',
          platform_name: 'StoryGraph',
          posted: true,
          posted_date: '2025-01-16',
          review_url: null,
        },
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.selectedPlatformIds).toEqual(new Set(['1', '3']));
      expect(result?.platformUrls).toEqual({});
      expect(result?.needsLinkSubmission).toBe(false);
    });

    it('should populate platformUrls with existing review URLs', () => {
      const platforms = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: true,
          posted_date: '2025-01-15',
          review_url: 'https://goodreads.com/review/123',
        },
        {
          id: '2',
          platform_name: 'Amazon',
          posted: false,
          posted_date: null,
          review_url: null,
        },
        {
          id: '3',
          platform_name: 'StoryGraph',
          posted: true,
          posted_date: '2025-01-16',
          review_url: 'https://storygraph.com/review/456',
        },
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.platformUrls).toEqual({
        '1': 'https://goodreads.com/review/123',
        '3': 'https://storygraph.com/review/456',
      });
      expect(result?.needsLinkSubmission).toBe(true);
    });

    it('should set needsLinkSubmission to true when any platform has review_url', () => {
      const platforms = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: false,
          posted_date: null,
          review_url: 'https://goodreads.com/review/123',
        },
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.needsLinkSubmission).toBe(true);
      expect(result?.platformUrls).toEqual({
        '1': 'https://goodreads.com/review/123',
      });
    });

    it('should handle platforms with review_url but not posted', () => {
      const platforms = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: false,
          posted_date: null,
          review_url: 'https://goodreads.com/review/123',
        },
        {
          id: '2',
          platform_name: 'Amazon',
          posted: true,
          posted_date: '2025-01-15',
          review_url: null,
        },
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.selectedPlatformIds).toEqual(new Set(['2']));
      expect(result?.platformUrls).toEqual({
        '1': 'https://goodreads.com/review/123',
      });
      expect(result?.needsLinkSubmission).toBe(true);
    });

    it('should handle all platforms posted with URLs', () => {
      const platforms = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: true,
          posted_date: '2025-01-15',
          review_url: 'https://goodreads.com/review/123',
        },
        {
          id: '2',
          platform_name: 'Amazon',
          posted: true,
          posted_date: '2025-01-16',
          review_url: 'https://amazon.com/review/456',
        },
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.selectedPlatformIds).toEqual(new Set(['1', '2']));
      expect(result?.platformUrls).toEqual({
        '1': 'https://goodreads.com/review/123',
        '2': 'https://amazon.com/review/456',
      });
      expect(result?.needsLinkSubmission).toBe(true);
    });

    it('should handle mixed posted status with mixed URLs', () => {
      const platforms = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: true,
          posted_date: '2025-01-15',
          review_url: 'https://goodreads.com/review/123',
        },
        {
          id: '2',
          platform_name: 'Amazon',
          posted: false,
          posted_date: null,
          review_url: null,
        },
        {
          id: '3',
          platform_name: 'StoryGraph',
          posted: true,
          posted_date: '2025-01-16',
          review_url: null,
        },
        {
          id: '4',
          platform_name: 'LibraryThing',
          posted: false,
          posted_date: null,
          review_url: 'https://librarything.com/review/789',
        },
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.selectedPlatformIds).toEqual(new Set(['1', '3']));
      expect(result?.platformUrls).toEqual({
        '1': 'https://goodreads.com/review/123',
        '4': 'https://librarything.com/review/789',
      });
      expect(result?.needsLinkSubmission).toBe(true);
    });
  });

  describe('prepareModalUpdates', () => {
    it('should return empty array when no platforms selected', () => {
      const selectedPlatformIds = new Set<string>();
      const platformUrls = {};

      const result = prepareModalUpdates(selectedPlatformIds, false, platformUrls);

      expect(result).toEqual([]);
    });

    it('should prepare updates for single platform without URLs', () => {
      const selectedPlatformIds = new Set(['1']);
      const platformUrls = {};

      const result = prepareModalUpdates(selectedPlatformIds, false, platformUrls);

      expect(result).toEqual([
        {
          id: '1',
          posted: true,
        },
      ]);
    });

    it('should prepare updates for multiple platforms without URLs', () => {
      const selectedPlatformIds = new Set(['1', '2', '3']);
      const platformUrls = {};

      const result = prepareModalUpdates(selectedPlatformIds, false, platformUrls);

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          { id: '1', posted: true },
          { id: '2', posted: true },
          { id: '3', posted: true },
        ])
      );
    });

    it('should include review_url when needsLinkSubmission is true and URL exists', () => {
      const selectedPlatformIds = new Set(['1']);
      const platformUrls = {
        '1': 'https://goodreads.com/review/123',
      };

      const result = prepareModalUpdates(selectedPlatformIds, true, platformUrls);

      expect(result).toEqual([
        {
          id: '1',
          posted: true,
          review_url: 'https://goodreads.com/review/123',
        },
      ]);
    });

    it('should not include review_url when needsLinkSubmission is false', () => {
      const selectedPlatformIds = new Set(['1']);
      const platformUrls = {
        '1': 'https://goodreads.com/review/123',
      };

      const result = prepareModalUpdates(selectedPlatformIds, false, platformUrls);

      expect(result).toEqual([
        {
          id: '1',
          posted: true,
        },
      ]);
    });

    it('should not include review_url when URL is missing but needsLinkSubmission is true', () => {
      const selectedPlatformIds = new Set(['1']);
      const platformUrls = {};

      const result = prepareModalUpdates(selectedPlatformIds, true, platformUrls);

      expect(result).toEqual([
        {
          id: '1',
          posted: true,
        },
      ]);
    });

    it('should handle mixed platforms with and without URLs', () => {
      const selectedPlatformIds = new Set(['1', '2', '3']);
      const platformUrls = {
        '1': 'https://goodreads.com/review/123',
        '3': 'https://storygraph.com/review/456',
      };

      const result = prepareModalUpdates(selectedPlatformIds, true, platformUrls);

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          {
            id: '1',
            posted: true,
            review_url: 'https://goodreads.com/review/123',
          },
          {
            id: '2',
            posted: true,
          },
          {
            id: '3',
            posted: true,
            review_url: 'https://storygraph.com/review/456',
          },
        ])
      );
    });

    it('should only include URLs for selected platforms', () => {
      const selectedPlatformIds = new Set(['1']);
      const platformUrls = {
        '1': 'https://goodreads.com/review/123',
        '2': 'https://amazon.com/review/456',
        '3': 'https://storygraph.com/review/789',
      };

      const result = prepareModalUpdates(selectedPlatformIds, true, platformUrls);

      expect(result).toEqual([
        {
          id: '1',
          posted: true,
          review_url: 'https://goodreads.com/review/123',
        },
      ]);
    });

    it('should handle empty string URLs correctly', () => {
      const selectedPlatformIds = new Set(['1']);
      const platformUrls = {
        '1': '',
      };

      const result = prepareModalUpdates(selectedPlatformIds, true, platformUrls);

      expect(result).toEqual([
        {
          id: '1',
          posted: true,
        },
      ]);
    });
  });
});
