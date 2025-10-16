import { reviewTrackingService } from '../reviewTracking.service';
import { supabase, generateId } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  generateId: jest.fn(),
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabaseFrom = supabase.from as jest.Mock;
const mockGenerateId = generateId as jest.Mock;

describe('ReviewTrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    let idCounter = 0;
    mockGenerateId.mockImplementation((prefix: string) => {
      idCounter++;
      return `${prefix}-${idCounter}`;
    });
  });

  describe('createReviewTracking', () => {
    const userId = 'user-123';
    const mockParams = {
      deadline_id: 'rd-123',
      review_due_date: '2025-10-20',
      needs_link_submission: true,
      platforms: [
        { name: 'NetGalley' },
        { name: 'Goodreads' },
        { name: 'Amazon' },
      ],
    };

    it('should create review tracking without review notes', async () => {
      let reviewTrackingCallCount = 0;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'rd-123', user_id: userId },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_tracking') {
          reviewTrackingCallCount++;
          if (reviewTrackingCallCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116', message: 'Not found' },
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'rt-1', deadline_id: 'rd-123' },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.createReviewTracking(
        userId,
        mockParams
      );

      expect(result).toEqual({ review_tracking_id: 'rt-1' });
    });

    it('should create review tracking with review notes', async () => {
      const paramsWithNotes = {
        ...mockParams,
        review_notes: 'Great book, loved the characters!',
      };

      let reviewTrackingCallCount = 0;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'rd-123', user_id: userId },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_tracking') {
          reviewTrackingCallCount++;
          if (reviewTrackingCallCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116', message: 'Not found' },
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'rt-1', deadline_id: 'rd-123' },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }

        if (table === 'deadline_progress') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { current_progress: 245 },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'deadline_notes') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'note-1' },
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.createReviewTracking(
        userId,
        paramsWithNotes
      );

      expect(result).toEqual({ review_tracking_id: 'rt-1' });
    });

    it('should throw error if deadline not found', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      }));

      await expect(
        reviewTrackingService.createReviewTracking(userId, mockParams)
      ).rejects.toThrow('Deadline not found or access denied');
    });

    it('should throw error if user does not own deadline', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }));

      await expect(
        reviewTrackingService.createReviewTracking(userId, mockParams)
      ).rejects.toThrow('Deadline not found or access denied');
    });

    it('should throw error if no platforms provided', async () => {
      const paramsNoPlatforms = {
        ...mockParams,
        platforms: [],
      };

      await expect(
        reviewTrackingService.createReviewTracking(userId, paramsNoPlatforms)
      ).rejects.toThrow('At least one platform must be selected');
    });
  });

  describe('updateReviewPlatforms', () => {
    const userId = 'user-123';
    const reviewTrackingId = 'rt-123';
    const mockUpdateParams = {
      platforms: [
        { id: 'rp-123', posted: true, review_url: 'https://netgalley.com/review/123' },
        { id: 'rp-124', posted: true },
      ],
    };

    it('should update multiple platforms successfully', async () => {
      let platformCallCount = 0;
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'rt-123', deadline_id: 'rd-123' },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'rd-123', user_id: userId },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          platformCallCount++;
          if (platformCallCount <= 2) {
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {},
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  { id: 'rp-123', posted: true },
                  { id: 'rp-124', posted: true },
                  { id: 'rp-125', posted: false },
                  { id: 'rp-126', posted: false },
                ],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.updateReviewPlatforms(
        userId,
        reviewTrackingId,
        mockUpdateParams
      );

      expect(result.completion_percentage).toBe(50);
    });

    it('should calculate 100% completion when all platforms posted', async () => {
      let platformCallCount = 0;
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'rt-123', deadline_id: 'rd-123' },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'rd-123', user_id: userId },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          platformCallCount++;
          if (platformCallCount <= 2) {
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {},
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  { id: 'rp-123', posted: true },
                  { id: 'rp-124', posted: true },
                ],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.updateReviewPlatforms(
        userId,
        reviewTrackingId,
        mockUpdateParams
      );

      expect(result.completion_percentage).toBe(100);
    });

    it('should throw error if user does not own review tracking', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'rt-123', deadline_id: 'rd-123' },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(
        reviewTrackingService.updateReviewPlatforms(
          userId,
          reviewTrackingId,
          mockUpdateParams
        )
      ).rejects.toThrow('Review tracking not found or access denied');
    });
  });

  describe('getReviewTrackingByDeadline', () => {
    const userId = 'user-123';
    const deadlineId = 'rd-123';

    it('should return review tracking with platforms', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'rd-123', user_id: userId },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'rt-123',
                    deadline_id: 'rd-123',
                    review_due_date: '2025-10-20',
                    needs_link_submission: true,
                    all_reviews_complete: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'rp-123',
                    platform_name: 'NetGalley',
                    posted: true,
                    posted_date: '2025-10-15',
                    review_url: 'https://netgalley.com/review/123',
                  },
                  {
                    id: 'rp-124',
                    platform_name: 'Goodreads',
                    posted: false,
                    posted_date: null,
                    review_url: null,
                  },
                ],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      const result =
        await reviewTrackingService.getReviewTrackingByDeadline(
          userId,
          deadlineId
        );

      expect(result).toEqual({
        review_tracking: {
          id: 'rt-123',
          deadline_id: 'rd-123',
          review_due_date: '2025-10-20',
          needs_link_submission: true,
          all_reviews_complete: false,
        },
        platforms: [
          {
            id: 'rp-123',
            platform_name: 'NetGalley',
            posted: true,
            posted_date: '2025-10-15',
            review_url: 'https://netgalley.com/review/123',
          },
          {
            id: 'rp-124',
            platform_name: 'Goodreads',
            posted: false,
            posted_date: null,
            review_url: null,
          },
        ],
        completion_percentage: 50,
      });
    });

    it('should return null if no review tracking exists', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'rd-123', user_id: userId },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'Not found' },
                }),
              }),
            }),
          };
        }

        return {};
      });

      const result =
        await reviewTrackingService.getReviewTrackingByDeadline(
          userId,
          deadlineId
        );

      expect(result).toBeNull();
    });

    it('should throw error if user does not own deadline', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }));

      await expect(
        reviewTrackingService.getReviewTrackingByDeadline(userId, deadlineId)
      ).rejects.toThrow('Deadline not found or access denied');
    });
  });
});
