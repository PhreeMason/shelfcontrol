import { generateId, supabase } from '@/lib/supabase';
import { reviewTrackingService } from '../reviewTracking.service';

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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-1', deadline_id: 'rd-123' }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'rd-123',
                        user_id: userId,
                        total_quantity: 350,
                      },
                    ],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-1', deadline_id: 'rd-123' }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ current_progress: 245 }],
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
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'note-1' }],
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

    it('should throw error if Book not found', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      }));

      await expect(
        reviewTrackingService.createReviewTracking(userId, mockParams)
      ).rejects.toThrow('Book not found or access denied');
    });

    it('should throw error if user does not own deadline', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }));

      await expect(
        reviewTrackingService.createReviewTracking(userId, mockParams)
      ).rejects.toThrow('Book not found or access denied');
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

    it('should throw error if review tracking already exists', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
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
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-existing' }],
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(
        reviewTrackingService.createReviewTracking(userId, mockParams)
      ).rejects.toThrow('Review tracking already exists for this deadline');
    });

    it('should throw error if review tracking insert fails', async () => {
      let reviewTrackingCallCount = 0;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            };
          }
          const insertError = new Error('Insert failed');
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: null,
                  error: insertError,
                }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(
        reviewTrackingService.createReviewTracking(userId, mockParams)
      ).rejects.toThrow('Insert failed');
    });

    it('should throw error if platforms insert fails', async () => {
      let reviewTrackingCallCount = 0;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-1', deadline_id: 'rd-123' }],
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          const platformsError = new Error('Platforms insert failed');
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: null,
                error: platformsError,
              }),
            }),
          };
        }

        return {};
      });

      await expect(
        reviewTrackingService.createReviewTracking(userId, mockParams)
      ).rejects.toThrow('Platforms insert failed');
    });
  });

  describe('updateReviewPlatforms', () => {
    const userId = 'user-123';
    const reviewTrackingId = 'rt-123';
    const mockUpdateParams = {
      platforms: [
        {
          id: 'rp-123',
          posted: true,
          review_url: 'https://netgalley.com/review/123',
        },
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
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-123', deadline_id: 'rd-123' }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          platformCallCount++;
          // Calls alternate: select(1), update(2), select(3), update(4), select(5)
          if (platformCallCount === 1 || platformCallCount === 3) {
            // Fetch current state for each platform
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ posted: false, posted_date: null }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (platformCallCount === 2 || platformCallCount === 4) {
            // Update each platform
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Final call: fetch all platforms for completion calculation
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
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-123', deadline_id: 'rd-123' }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          platformCallCount++;
          // Calls alternate: select(1), update(2), select(3), update(4), select(5)
          if (platformCallCount === 1 || platformCallCount === 3) {
            // Fetch current state for each platform
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ posted: false, posted_date: null }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (platformCallCount === 2 || platformCallCount === 4) {
            // Update each platform
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Final call: fetch all platforms for completion calculation
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
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-123', deadline_id: 'rd-123' }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [],
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

    it('should throw error if review tracking not found', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      }));

      await expect(
        reviewTrackingService.updateReviewPlatforms(
          userId,
          reviewTrackingId,
          mockUpdateParams
        )
      ).rejects.toThrow('Review tracking not found');
    });

    it('should calculate 0% completion when no platforms exist', async () => {
      let platformCallCount = 0;
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-123', deadline_id: 'rd-123' }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          platformCallCount++;
          // Calls alternate: select(1), update(2), select(3), update(4), select(5)
          if (platformCallCount === 1 || platformCallCount === 3) {
            // Fetch current state for each platform
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ posted: false, posted_date: null }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (platformCallCount === 2 || platformCallCount === 4) {
            // Update each platform
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Final call: fetch all platforms for completion calculation (empty)
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
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

      expect(result.completion_percentage).toBe(0);
    });

    it('should preserve posted_date when platform is already posted', async () => {
      const existingPostedDate = '2025-01-15T10:00:00.000Z';
      let platformCallCount = 0;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-123', deadline_id: 'rd-123' }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          platformCallCount++;
          // First call: fetch current state (already posted)
          if (platformCallCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ posted: true, posted_date: existingPostedDate }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Second call: update
          if (platformCallCount === 2) {
            return {
              update: jest.fn(updatePayload => {
                // Verify that posted_date is NOT being updated
                expect(updatePayload.posted_date).toBeUndefined();
                return {
                  eq: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          // Third call: fetch all platforms for completion calculation
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: 'rp-123', posted: true }],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      await reviewTrackingService.updateReviewPlatforms(
        userId,
        reviewTrackingId,
        { platforms: [{ id: 'rp-123', posted: true }] }
      );
    });

    it('should only set posted_date when changing from not posted to posted', async () => {
      let platformCallCount = 0;

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'rt-123', deadline_id: 'rd-123' }],
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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          platformCallCount++;
          // First call: fetch current state (not posted)
          if (platformCallCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ posted: false, posted_date: null }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Second call: update (should include posted_date)
          if (platformCallCount === 2) {
            return {
              update: jest.fn(updatePayload => {
                // Verify that posted_date IS being set
                expect(updatePayload.posted_date).toBeDefined();
                expect(updatePayload.posted).toBe(true);
                return {
                  eq: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          // Third call: fetch all platforms for completion calculation
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: 'rp-123', posted: true }],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      await reviewTrackingService.updateReviewPlatforms(
        userId,
        reviewTrackingId,
        { platforms: [{ id: 'rp-123', posted: true }] }
      );
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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
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
                limit: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'rt-123',
                      deadline_id: 'rd-123',
                      review_due_date: '2025-10-20',
                      needs_link_submission: true,
                      all_reviews_complete: false,
                    },
                  ],
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

      const result = await reviewTrackingService.getReviewTrackingByDeadline(
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
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
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
                limit: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'Not found' },
                }),
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.getReviewTrackingByDeadline(
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
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }));

      await expect(
        reviewTrackingService.getReviewTrackingByDeadline(userId, deadlineId)
      ).rejects.toThrow('Book not found or access denied');
    });

    it('should throw error if review tracking query fails with non-PGRST116 error', async () => {
      const dbError = new Error('Database error');
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
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
                limit: jest.fn().mockResolvedValue({
                  data: null,
                  error: dbError,
                }),
              }),
            }),
          };
        }

        return {};
      });

      await expect(
        reviewTrackingService.getReviewTrackingByDeadline(userId, deadlineId)
      ).rejects.toThrow('Database error');
    });

    it('should calculate 0% completion when no platforms exist', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'rd-123', user_id: userId }],
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
                limit: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'rt-123',
                      deadline_id: 'rd-123',
                      review_due_date: '2025-10-20',
                      needs_link_submission: true,
                      all_reviews_complete: false,
                    },
                  ],
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
                data: [],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.getReviewTrackingByDeadline(
        userId,
        deadlineId
      );

      expect(result?.completion_percentage).toBe(0);
      expect(result?.platforms).toEqual([]);
    });
  });

  describe('getUserPlatforms', () => {
    const userId = 'user-123';

    it('should return unique platforms ordered by most recent', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: 'rd-123' }, { id: 'rd-124' }],
                error: null,
              }),
            }),
          };
        }

        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: 'rt-123' }, { id: 'rt-124' }],
                error: null,
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    { platform_name: 'NetGalley', created_at: '2025-10-15' },
                    { platform_name: 'Goodreads', created_at: '2025-10-14' },
                    {
                      platform_name: 'Blog: https://myblog.com',
                      created_at: '2025-10-13',
                    },
                    { platform_name: 'NetGalley', created_at: '2025-10-12' },
                    { platform_name: 'Instagram', created_at: '2025-10-11' },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.getUserPlatforms(userId);

      expect(result).toEqual([
        'NetGalley',
        'Goodreads',
        'Blog: https://myblog.com',
        'Instagram',
      ]);
    });

    it('should return empty array when user has no platforms', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.getUserPlatforms(userId);

      expect(result).toEqual([]);
    });

    it('should return empty array when query fails', async () => {
      const dbError = new Error('Database error');
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: 'rd-123' }],
                error: null,
              }),
            }),
          };
        }

        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: 'rt-123' }],
                error: null,
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: dbError,
                }),
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.getUserPlatforms(userId);

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: 'rd-123' }],
                error: null,
              }),
            }),
          };
        }

        if (table === 'review_tracking') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: 'rt-123' }],
                error: null,
              }),
            }),
          };
        }

        if (table === 'review_platforms') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      const result = await reviewTrackingService.getUserPlatforms(userId);

      expect(result).toEqual([]);
    });
  });
});
