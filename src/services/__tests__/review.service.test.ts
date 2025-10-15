import { reviewService } from '../review.service';
import { supabase, generateId } from '@/lib/supabase';
import { notesService } from '../notes.service';
import {
  CreateReviewTrackingParams,
  UpdateReviewPlatformsParams,
} from '@/types/review.types';

jest.mock('@/lib/supabase', () => ({
  generateId: jest.fn(),
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('../notes.service', () => ({
  notesService: {
    addNote: jest.fn(),
  },
}));

const mockSupabaseFrom = supabase.from as jest.Mock;
const mockGenerateId = generateId as jest.Mock;
const mockNotesService = notesService as jest.Mocked<typeof notesService>;

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    let idCounter = 1;
    mockGenerateId.mockImplementation((prefix: string) => {
      return `${prefix}${idCounter++}`;
    });
  });

  describe('createReviewTracking', () => {
    const userId = 'user-123';
    const mockParams: CreateReviewTrackingParams = {
      deadlineId: 'rd-123',
      reviewDueDate: '2024-12-31',
      needsLinkSubmission: true,
      platforms: [{ name: 'NetGalley' }, { name: 'Goodreads' }],
    };

    it('should create review tracking with platforms successfully', async () => {
      const mockReviewTracking = {
        id: 'rt1',
        deadline_id: 'rd-123',
        review_due_date: '2024-12-31',
        needs_link_submission: true,
        all_reviews_complete: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockPlatforms = [
        {
          id: 'rp2',
          review_tracking_id: 'rt1',
          platform_name: 'NetGalley',
          posted: false,
          posted_date: null,
          review_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'rp3',
          review_tracking_id: 'rt1',
          platform_name: 'Goodreads',
          posted: false,
          posted_date: null,
          review_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'review_tracking') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: mockReviewTracking, error: null }),
          };
        } else if (table === 'review_platforms') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest
              .fn()
              .mockResolvedValue({ data: mockPlatforms, error: null }),
          };
        }
        return {} as any;
      });

      const result = await reviewService.createReviewTracking(
        userId,
        mockParams
      );

      expect(mockSupabaseFrom).toHaveBeenCalledWith('review_tracking');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('review_platforms');
      expect(result.id).toBe('rt1');
      expect(result.platforms).toHaveLength(2);
      expect(result.platforms[0].platform_name).toBe('NetGalley');
      expect(result.needs_link_submission).toBe(true);
    });

    it('should create deadline_notes entry when reviewNotes provided', async () => {
      const paramsWithNotes = {
        ...mockParams,
        reviewNotes: 'Great book! Need to review ASAP.',
      };

      const mockReviewTracking = {
        id: 'rt1',
        deadline_id: 'rd-123',
        review_due_date: '2024-12-31',
        needs_link_submission: true,
        all_reviews_complete: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockPlatforms = [
        {
          id: 'rp2',
          review_tracking_id: 'rt1',
          platform_name: 'NetGalley',
          posted: false,
          posted_date: null,
          review_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'review_tracking') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: mockReviewTracking, error: null }),
          };
        } else if (table === 'review_platforms') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest
              .fn()
              .mockResolvedValue({ data: mockPlatforms, error: null }),
          };
        } else if (table === 'deadlines') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: { user_id: userId }, error: null }),
          };
        } else if (table === 'deadline_progress') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: { current_progress: 245 }, error: null }),
          };
        }
        return {} as any;
      });

      mockNotesService.addNote.mockResolvedValue({
        id: 'dn1',
        user_id: userId,
        deadline_id: 'rd-123',
        note_text: 'Great book! Need to review ASAP.',
        deadline_progress: 245,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      await reviewService.createReviewTracking(userId, paramsWithNotes);

      expect(mockNotesService.addNote).toHaveBeenCalledWith(
        userId,
        'rd-123',
        'Great book! Need to review ASAP.',
        245
      );
    });

    it('should throw error if user does not own deadline when creating notes', async () => {
      const paramsWithNotes = {
        ...mockParams,
        reviewNotes: 'Great book!',
      };

      const mockReviewTracking = {
        id: 'rt1',
        deadline_id: 'rd-123',
        review_due_date: '2024-12-31',
        needs_link_submission: true,
        all_reviews_complete: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockPlatforms = [
        {
          id: 'rp2',
          review_tracking_id: 'rt1',
          platform_name: 'NetGalley',
          posted: false,
          posted_date: null,
          review_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({ data: mockReviewTracking, error: null })
        .mockResolvedValueOnce({ data: mockPlatforms, error: null })
        .mockResolvedValueOnce({
          data: { user_id: 'different-user' },
          error: null,
        });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        reviewService.createReviewTracking(userId, paramsWithNotes)
      ).rejects.toThrow('Unauthorized: deadline does not belong to user');
    });
  });

  describe('getReviewTrackingByDeadlineId', () => {
    const userId = 'user-123';
    const deadlineId = 'rd-123';

    it('should return review tracking with platforms', async () => {
      const mockTracking = {
        id: 'rt1',
        deadline_id: deadlineId,
        review_due_date: '2024-12-31',
        needs_link_submission: true,
        all_reviews_complete: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        platforms: [
          {
            id: 'rp1',
            review_tracking_id: 'rt1',
            platform_name: 'NetGalley',
            posted: true,
            posted_date: '2024-01-15T00:00:00Z',
            review_url: 'https://netgalley.com/review/123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
        ],
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({
          data: { user_id: userId },
          error: null,
        })
        .mockResolvedValueOnce({ data: mockTracking, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await reviewService.getReviewTrackingByDeadlineId(
        userId,
        deadlineId
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe('rt1');
      expect(result!.platforms).toHaveLength(1);
      expect(result!.platforms[0].posted).toBe(true);
    });

    it('should return null if review tracking not found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({
          data: { user_id: userId },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await reviewService.getReviewTrackingByDeadlineId(
        userId,
        deadlineId
      );

      expect(result).toBeNull();
    });

    it('should return null if user does not own deadline', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: { user_id: 'different-user' },
        error: null,
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await reviewService.getReviewTrackingByDeadlineId(
        userId,
        deadlineId
      );

      expect(result).toBeNull();
    });
  });

  describe('updateReviewPlatforms', () => {
    const userId = 'user-123';
    const reviewTrackingId = 'rt1';

    it('should update multiple platforms and return progress', async () => {
      const updateParams: UpdateReviewPlatformsParams = {
        platforms: [
          {
            id: 'rp1',
            posted: true,
            reviewUrl: 'https://netgalley.com/review/123',
          },
          { id: 'rp2', posted: true },
        ],
      };

      const mockReviewTracking = {
        deadline_id: 'rd-123',
        deadline: { user_id: userId },
      };

      const mockUpdatedPlatform1 = {
        id: 'rp1',
        review_tracking_id: reviewTrackingId,
        platform_name: 'NetGalley',
        posted: true,
        posted_date: '2024-01-15T00:00:00Z',
        review_url: 'https://netgalley.com/review/123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const mockUpdatedPlatform2 = {
        id: 'rp2',
        review_tracking_id: reviewTrackingId,
        platform_name: 'Goodreads',
        posted: true,
        posted_date: '2024-01-15T00:00:00Z',
        review_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const allPlatforms = [mockUpdatedPlatform1, mockUpdatedPlatform2];

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;

        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: mockReviewTracking, error: null }),
          };
        } else if (callCount === 2) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: mockUpdatedPlatform1, error: null }),
          };
        } else if (callCount === 3) {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: mockUpdatedPlatform2, error: null }),
          };
        } else if (callCount === 4) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest
              .fn()
              .mockResolvedValue({ data: allPlatforms, error: null }),
          };
        }
        return {} as any;
      });

      const result = await reviewService.updateReviewPlatforms(
        userId,
        reviewTrackingId,
        updateParams
      );

      expect(result.platforms).toHaveLength(2);
      expect(result.progress.totalPlatforms).toBe(2);
      expect(result.progress.postedPlatforms).toBe(2);
      expect(result.progress.completionPercentage).toBe(100);
    });

    it('should throw error if user does not own review tracking', async () => {
      const updateParams: UpdateReviewPlatformsParams = {
        platforms: [{ id: 'rp1', posted: true }],
      };

      const mockReviewTracking = {
        deadline_id: 'rd-123',
        deadline: { user_id: 'different-user' },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: mockReviewTracking,
        error: null,
      });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(
        reviewService.updateReviewPlatforms(
          userId,
          reviewTrackingId,
          updateParams
        )
      ).rejects.toThrow('Unauthorized: review tracking not found or not owned');
    });
  });

  describe('calculateProgress', () => {
    it('should calculate 0% when no platforms posted', () => {
      const platforms = [
        { posted: false },
        { posted: false },
        { posted: null },
      ];

      const result = reviewService.calculateProgress(platforms);

      expect(result.totalPlatforms).toBe(3);
      expect(result.postedPlatforms).toBe(0);
      expect(result.completionPercentage).toBe(0);
    });

    it('should calculate 50% when half platforms posted', () => {
      const platforms = [{ posted: true }, { posted: false }];

      const result = reviewService.calculateProgress(platforms);

      expect(result.totalPlatforms).toBe(2);
      expect(result.postedPlatforms).toBe(1);
      expect(result.completionPercentage).toBe(50);
    });

    it('should calculate 100% when all platforms posted', () => {
      const platforms = [{ posted: true }, { posted: true }, { posted: true }];

      const result = reviewService.calculateProgress(platforms);

      expect(result.totalPlatforms).toBe(3);
      expect(result.postedPlatforms).toBe(3);
      expect(result.completionPercentage).toBe(100);
    });

    it('should handle empty platforms array', () => {
      const result = reviewService.calculateProgress([]);

      expect(result.totalPlatforms).toBe(0);
      expect(result.postedPlatforms).toBe(0);
      expect(result.completionPercentage).toBe(0);
    });
  });
});
