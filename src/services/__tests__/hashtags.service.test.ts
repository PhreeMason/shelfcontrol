import { generateId, supabase } from '@/lib/supabase';
import { hashtagsService, HashtagLimitError } from '../hashtags.service';
import { activityService } from '../activity.service';
import { MAX_HASHTAGS_PER_NOTE } from '@/utils/hashtagUtils';

jest.mock('@/lib/supabase', () => ({
  generateId: jest.fn(),
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('../activity.service', () => ({
  activityService: {
    trackUserActivity: jest.fn(),
  },
}));

const mockSupabaseFrom = supabase.from as jest.Mock;
const mockGenerateId = generateId as jest.Mock;
const mockActivityService = activityService as jest.Mocked<
  typeof activityService
>;

describe('HashtagsService', () => {
  const userId = 'user-123';
  const noteId = 'note-123';
  const hashtagId = 'ht-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockImplementation((prefix: string) => `${prefix}-123`);
  });

  describe('getAllHashtags', () => {
    it('should fetch all hashtags for a user', async () => {
      const mockHashtags = [
        { id: 'ht-1', name: 'review', color: '#3b82f6', user_id: userId },
        { id: 'ht-2', name: 'fiction', color: '#10b981', user_id: userId },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: mockHashtags, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await hashtagsService.getAllHashtags(userId);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('hashtags');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(result).toEqual(mockHashtags);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Database error');
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: null, error: mockError });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      await expect(hashtagsService.getAllHashtags(userId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getNoteHashtags', () => {
    it('should fetch hashtags for a specific note', async () => {
      const mockData = [
        { hashtags: { id: 'ht-1', name: 'review', color: '#3b82f6' } },
        { hashtags: { id: 'ht-2', name: 'fiction', color: '#10b981' } },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Last eq call resolves with data
      mockChain.eq = jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: mockData, error: null }));

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: mockChain.eq,
          }),
        }),
      });

      const result = await hashtagsService.getNoteHashtags(userId, noteId);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('note_hashtags');
      expect(result).toHaveLength(2);
    });
  });

  describe('getAllNoteHashtags', () => {
    it('should fetch all note-hashtag relationships for a deadline using JOIN', async () => {
      const mockData = [
        { id: 'nht-1', note_id: 'note-1', hashtag_id: 'ht-1', user_id: userId },
        { id: 'nht-2', note_id: 'note-2', hashtag_id: 'ht-2', user_id: userId },
      ];

      const mockSelect = jest.fn().mockReturnThis();

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      const result = await hashtagsService.getAllNoteHashtags(
        userId,
        'deadline-123'
      );

      expect(mockSupabaseFrom).toHaveBeenCalledWith('note_hashtags');
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('note:note_id!inner')
      );
      expect(result).toEqual(mockData);
    });

    it('should return empty array if no data', async () => {
      const mockSelect = jest.fn().mockReturnThis();

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const result = await hashtagsService.getAllNoteHashtags(
        userId,
        'deadline-123'
      );

      expect(result).toEqual([]);
    });
  });

  describe('createHashtag', () => {
    it('should create a new hashtag', async () => {
      const hashtagData = { name: 'review', color: '#3b82f6', user_id: userId };
      const mockCreatedHashtag = {
        id: 'ht-123',
        ...hashtagData,
        name: 'review',
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockCreatedHashtag], error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await hashtagsService.createHashtag(userId, hashtagData);

      expect(mockGenerateId).toHaveBeenCalledWith('ht');
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'ht-123',
        user_id: userId,
        name: 'review',
        color: '#3b82f6',
      });
      expect(mockActivityService.trackUserActivity).toHaveBeenCalledWith(
        'hashtag_created',
        {
          hashtagId: 'ht-123',
          hashtagName: 'review',
        }
      );
      expect(result).toEqual(mockCreatedHashtag);
    });

    it('should normalize hashtag name to lowercase', async () => {
      const hashtagData = { name: 'REVIEW', color: '#3b82f6', user_id: userId };
      const mockCreatedHashtag = {
        id: 'ht-123',
        name: 'review',
        color: '#3b82f6',
        user_id: userId,
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockCreatedHashtag], error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        limit: mockLimit,
      });

      await hashtagsService.createHashtag(userId, hashtagData);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'review' })
      );
    });
  });

  describe('addHashtagToNote', () => {
    it('should add a hashtag to a note', async () => {
      const mockNoteHashtag = {
        id: 'nht-123',
        note_id: noteId,
        hashtag_id: hashtagId,
        user_id: userId,
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLimit = jest
        .fn()
        .mockResolvedValue({ data: [mockNoteHashtag], error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        limit: mockLimit,
      });

      const result = await hashtagsService.addHashtagToNote(
        userId,
        noteId,
        hashtagId
      );

      expect(mockGenerateId).toHaveBeenCalledWith('nht');
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'nht-123',
        user_id: userId,
        note_id: noteId,
        hashtag_id: hashtagId,
      });
      expect(mockActivityService.trackUserActivity).toHaveBeenCalledWith(
        'hashtag_added_to_note',
        {
          noteId,
          hashtagId,
        }
      );
      expect(result).toEqual(mockNoteHashtag);
    });
  });

  describe('removeHashtagFromNote', () => {
    it('should remove a hashtag from a note', async () => {
      mockSupabaseFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      });

      const result = await hashtagsService.removeHashtagFromNote(
        userId,
        noteId,
        hashtagId
      );

      expect(mockSupabaseFrom).toHaveBeenCalledWith('note_hashtags');
      expect(mockActivityService.trackUserActivity).toHaveBeenCalledWith(
        'hashtag_removed_from_note',
        {
          noteId,
          hashtagId,
        }
      );
      expect(result).toBe(hashtagId);
    });
  });

  describe('syncNoteHashtags', () => {
    it('should throw HashtagLimitError when exceeding limit', async () => {
      const noteText = '#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9';

      await expect(
        hashtagsService.syncNoteHashtags(userId, noteId, noteText)
      ).rejects.toThrow(HashtagLimitError);

      await expect(
        hashtagsService.syncNoteHashtags(userId, noteId, noteText)
      ).rejects.toThrow(
        `Notes can have a maximum of ${MAX_HASHTAGS_PER_NOTE} hashtags`
      );
    });

    it('should batch create new hashtags', async () => {
      const noteText = '#review #fiction #new';
      const existingHashtags = [
        { id: 'ht-1', name: 'review', color: '#3b82f6', user_id: userId },
      ];
      const currentNoteHashtags: any[] = [];

      // Mock getAllHashtags
      const mockGetAllHashtags = jest
        .spyOn(hashtagsService, 'getAllHashtags')
        .mockResolvedValue(existingHashtags as any);

      // Mock getNoteHashtags
      const mockGetNoteHashtags = jest
        .spyOn(hashtagsService, 'getNoteHashtags')
        .mockResolvedValue(currentNoteHashtags as any);

      // Mock batch insert for new hashtags
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: 'ht-2', name: 'fiction', color: '#10b981', user_id: userId },
          { id: 'ht-3', name: 'new', color: '#8b5cf6', user_id: userId },
        ],
        error: null,
      });

      const mockInsertNoteHashtags = jest
        .fn()
        .mockResolvedValue({ error: null });

      mockSupabaseFrom.mockImplementation(table => {
        if (table === 'hashtags') {
          return { insert: mockInsert, select: mockSelect };
        }
        if (table === 'note_hashtags') {
          return { insert: mockInsertNoteHashtags };
        }
        return {};
      });

      await hashtagsService.syncNoteHashtags(userId, noteId, noteText);

      // Should batch insert 2 new hashtags (fiction and new)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'fiction' }),
          expect.objectContaining({ name: 'new' }),
        ])
      );

      // Should track activity for each new hashtag
      expect(mockActivityService.trackUserActivity).toHaveBeenCalledWith(
        'hashtag_created',
        expect.any(Object)
      );

      mockGetAllHashtags.mockRestore();
      mockGetNoteHashtags.mockRestore();
    });

    it('should batch remove hashtags no longer in text', async () => {
      const noteText = '#review';
      const existingHashtags = [
        { id: 'ht-1', name: 'review', color: '#3b82f6', user_id: userId },
        { id: 'ht-2', name: 'fiction', color: '#10b981', user_id: userId },
      ];
      const currentNoteHashtags = [
        { id: 'ht-1', name: 'review', color: '#3b82f6', user_id: userId },
        { id: 'ht-2', name: 'fiction', color: '#10b981', user_id: userId },
      ];

      // Mock getAllHashtags
      const mockGetAllHashtags = jest
        .spyOn(hashtagsService, 'getAllHashtags')
        .mockResolvedValue(existingHashtags as any);

      // Mock getNoteHashtags
      const mockGetNoteHashtags = jest
        .spyOn(hashtagsService, 'getNoteHashtags')
        .mockResolvedValue(currentNoteHashtags as any);

      // Mock cleanup
      const mockCleanup = jest
        .spyOn(hashtagsService, 'cleanupOrphanedHashtags')
        .mockResolvedValue(undefined);

      // Mock batch delete with proper chaining
      const mockIn = jest.fn().mockResolvedValue({ error: null });

      mockSupabaseFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: mockIn,
            }),
          }),
        }),
      });

      await hashtagsService.syncNoteHashtags(userId, noteId, noteText);

      // Should batch delete hashtags no longer in text
      expect(mockIn).toHaveBeenCalledWith('hashtag_id', ['ht-2']);

      // Should trigger cleanup
      expect(mockCleanup).toHaveBeenCalledWith(userId);

      mockGetAllHashtags.mockRestore();
      mockGetNoteHashtags.mockRestore();
      mockCleanup.mockRestore();
    });

    it('should batch add new hashtag associations', async () => {
      const noteText = '#review #fiction';
      const existingHashtags = [
        { id: 'ht-1', name: 'review', color: '#3b82f6', user_id: userId },
        { id: 'ht-2', name: 'fiction', color: '#10b981', user_id: userId },
      ];
      const currentNoteHashtags: any[] = [];

      // Mock getAllHashtags
      const mockGetAllHashtags = jest
        .spyOn(hashtagsService, 'getAllHashtags')
        .mockResolvedValue(existingHashtags as any);

      // Mock getNoteHashtags
      const mockGetNoteHashtags = jest
        .spyOn(hashtagsService, 'getNoteHashtags')
        .mockResolvedValue(currentNoteHashtags as any);

      // Mock batch insert for note-hashtag associations
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
      });

      await hashtagsService.syncNoteHashtags(userId, noteId, noteText);

      // Should batch insert 2 note-hashtag associations
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ note_id: noteId, hashtag_id: 'ht-1' }),
          expect.objectContaining({ note_id: noteId, hashtag_id: 'ht-2' }),
        ])
      );

      mockGetAllHashtags.mockRestore();
      mockGetNoteHashtags.mockRestore();
    });
  });

  describe('cleanupOrphanedHashtags', () => {
    it('should delete hashtags with no note associations', async () => {
      const mockData = [
        { id: 'ht-1', note_hashtags: [{ hashtag_id: 'ht-1' }] },
        { id: 'ht-2', note_hashtags: [] }, // Orphaned
        { id: 'ht-3', note_hashtags: [] }, // Orphaned
      ];

      const mockIn = jest.fn().mockResolvedValue({ error: null });

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: query for hashtags with note_hashtags
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
            }),
          };
        } else {
          // Second call: delete orphaned hashtags
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: mockIn,
              }),
            }),
          };
        }
      });

      await hashtagsService.cleanupOrphanedHashtags(userId);

      // Should delete only orphaned hashtags
      expect(mockIn).toHaveBeenCalledWith('id', ['ht-2', 'ht-3']);

      // Should track cleanup activity
      expect(mockActivityService.trackUserActivity).toHaveBeenCalledWith(
        'hashtags_cleaned_up',
        {
          count: 2,
        }
      );
    });

    it('should not fail if query errors (silent failure)', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error('DB error') });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      // Should not throw error
      await expect(
        hashtagsService.cleanupOrphanedHashtags(userId)
      ).resolves.not.toThrow();

      // Should not track activity if error
      expect(mockActivityService.trackUserActivity).not.toHaveBeenCalledWith(
        'hashtags_cleaned_up',
        expect.any(Object)
      );
    });

    it('should do nothing if no orphaned hashtags', async () => {
      const mockData = [
        { id: 'ht-1', note_hashtags: [{ hashtag_id: 'ht-1' }] },
        { id: 'ht-2', note_hashtags: [{ hashtag_id: 'ht-2' }] },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest
        .fn()
        .mockResolvedValue({ data: mockData, error: null });
      const mockDelete = jest.fn().mockReturnThis();

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        delete: mockDelete,
      });

      await hashtagsService.cleanupOrphanedHashtags(userId);

      // Should not call delete
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
