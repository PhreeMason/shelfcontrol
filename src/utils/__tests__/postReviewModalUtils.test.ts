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
          review_url: null,
        },
      ];

      const result = initializeModalState(platforms, false);

      expect(result).toBeNull();
    });

    it('should return empty state for empty platforms array', () => {
      const result = initializeModalState([], true);

      expect(result).toEqual({
        selectedPlatformIds: new Set(),
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
    });

    it('should select only posted platforms regardless of review_url', () => {
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
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.selectedPlatformIds).toEqual(new Set(['1', '3']));
    });

    it('should handle all platforms posted', () => {
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
          posted: true,
          posted_date: '2025-01-16',
          review_url: null,
        },
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.selectedPlatformIds).toEqual(new Set(['1', '2']));
    });

    it('should handle no platforms posted', () => {
      const platforms = [
        {
          id: '1',
          platform_name: 'Goodreads',
          posted: false,
          posted_date: null,
          review_url: null,
        },
        {
          id: '2',
          platform_name: 'Amazon',
          posted: false,
          posted_date: null,
          review_url: null,
        },
      ];

      const result = initializeModalState(platforms, true);

      expect(result?.selectedPlatformIds).toEqual(new Set());
    });
  });

  describe('prepareModalUpdates', () => {
    it('should return empty array when no platforms selected', () => {
      const selectedPlatformIds = new Set<string>();

      const result = prepareModalUpdates(selectedPlatformIds);

      expect(result).toEqual([]);
    });

    it('should prepare updates for single platform', () => {
      const selectedPlatformIds = new Set(['1']);

      const result = prepareModalUpdates(selectedPlatformIds);

      expect(result).toEqual([
        {
          id: '1',
          posted: true,
        },
      ]);
    });

    it('should prepare updates for multiple platforms', () => {
      const selectedPlatformIds = new Set(['1', '2', '3']);

      const result = prepareModalUpdates(selectedPlatformIds);

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          { id: '1', posted: true },
          { id: '2', posted: true },
          { id: '3', posted: true },
        ])
      );
    });

    it('should only include selected platforms in updates', () => {
      const selectedPlatformIds = new Set(['1', '3']);

      const result = prepareModalUpdates(selectedPlatformIds);

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { id: '1', posted: true },
          { id: '3', posted: true },
        ])
      );
    });

    it('should handle all posted as true', () => {
      const selectedPlatformIds = new Set(['1', '2']);

      const result = prepareModalUpdates(selectedPlatformIds);

      result.forEach(update => {
        expect(update.posted).toBe(true);
      });
    });
  });
});
