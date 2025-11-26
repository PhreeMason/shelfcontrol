import { generateId, supabase } from '@/lib/supabase';
import { activityService } from '../activity.service';
import { hashtagsService } from '../hashtags.service';
import { notesService } from '../notes.service';

jest.mock('@/lib/supabase', () => ({
  generateId: jest.fn(),
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('../hashtags.service', () => ({
  hashtagsService: {
    syncNoteHashtags: jest.fn(),
  },
}));

jest.mock('../activity.service', () => ({
  activityService: {
    trackUserActivity: jest.fn(),
  },
}));

const mockSupabaseFrom = supabase.from as jest.Mock;
const mockGenerateId = generateId as jest.Mock;
const mockHashtagsService = hashtagsService as jest.Mocked<
  typeof hashtagsService
>;
const mockActivityService = activityService as jest.Mocked<
  typeof activityService
>;

describe('NotesService', () => {
  const userId = 'user-123';
  const deadlineId = 'rd-123';
  const noteId = 'dn-123';
  const noteText = 'This is a test note with #hashtag';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateId.mockImplementation((prefix: string) => `${prefix}-123`);
  });

  describe('getNotes', () => {
    it('should fetch all notes for a deadline', async () => {
      const mockNotes = [
        { id: 'dn-1', note_text: 'Note 1', deadline_progress: 10 },
        { id: 'dn-2', note_text: 'Note 2', deadline_progress: 20 },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest
        .fn()
        .mockResolvedValue({ data: mockNotes, error: null });

      mockSupabaseFrom.mockReturnValue({
        select: mockSelect,
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      const result = await notesService.getNotes(userId, deadlineId);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('deadline_notes');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockNotes);
    });
  });

  describe('addNote - with automatic progress fetching', () => {
    it('should fetch progress from DB when not provided', async () => {
      const mockProgressData = [{ current_progress: 30 }];
      const mockDeadlineData = { total_quantity: 100 };
      const mockCreatedNote = {
        id: noteId,
        note_text: noteText,
        deadline_progress: 30, // 30/100 = 30%
        user_id: userId,
        deadline_id: deadlineId,
      };

      // Mock progress query (now only filters by deadline_id, not user_id)
      const mockProgressSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue({ data: mockProgressData, error: null }),
          }),
        }),
      });

      // Mock deadline query
      const mockDeadlineSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: mockDeadlineData, error: null }),
          }),
        }),
      });

      // Mock note insert
      const mockNoteInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest
            .fn()
            .mockResolvedValue({ data: [mockCreatedNote], error: null }),
        }),
      });

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockProgressSelect };
        } else if (callCount === 2) {
          return { select: mockDeadlineSelect };
        } else {
          return { insert: mockNoteInsert };
        }
      });

      const result = await notesService.addNote(userId, deadlineId, noteText);

      // Should fetch progress
      expect(mockProgressSelect).toHaveBeenCalledWith('current_progress');

      // Should fetch deadline
      expect(mockDeadlineSelect).toHaveBeenCalledWith('total_quantity');

      // Should insert note with calculated progress
      expect(mockNoteInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          deadline_progress: 30,
        })
      );

      // Should sync hashtags
      expect(mockHashtagsService.syncNoteHashtags).toHaveBeenCalledWith(
        userId,
        noteId,
        noteText
      );

      // Should track activity
      expect(mockActivityService.trackUserActivity).toHaveBeenCalledWith(
        'note_created',
        {
          deadlineId,
          noteId,
        }
      );

      expect(result).toEqual(mockCreatedNote);
    });

    it('should calculate progress percentage correctly', async () => {
      const mockProgressData = [{ current_progress: 45 }];
      const mockDeadlineData = { total_quantity: 200 };
      const expectedPercentage = Math.floor((45 / 200) * 100); // 22%

      const mockProgressSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue({ data: mockProgressData, error: null }),
          }),
        }),
      });

      const mockDeadlineSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: mockDeadlineData, error: null }),
          }),
        }),
      });

      const mockNoteInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: noteId, deadline_progress: expectedPercentage }],
            error: null,
          }),
        }),
      });

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return { select: mockProgressSelect };
        if (callCount === 2) return { select: mockDeadlineSelect };
        return { insert: mockNoteInsert };
      });

      await notesService.addNote(userId, deadlineId, noteText);

      expect(mockNoteInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          deadline_progress: 22,
        })
      );
    });

    it('should default to 0% when no progress exists', async () => {
      const mockProgressData: any[] = [];
      const mockDeadlineData = { total_quantity: 100 };

      const mockProgressSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue({ data: mockProgressData, error: null }),
          }),
        }),
      });

      const mockDeadlineSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: mockDeadlineData, error: null }),
          }),
        }),
      });

      const mockNoteInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: noteId, deadline_progress: 0 }],
            error: null,
          }),
        }),
      });

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return { select: mockProgressSelect };
        if (callCount === 2) return { select: mockDeadlineSelect };
        return { insert: mockNoteInsert };
      });

      await notesService.addNote(userId, deadlineId, noteText);

      expect(mockNoteInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          deadline_progress: 0,
        })
      );
    });

    it('should default to 0% when total_quantity is 0', async () => {
      const mockProgressData = [{ current_progress: 50 }];
      const mockDeadlineData = { total_quantity: 0 };

      const mockProgressSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue({ data: mockProgressData, error: null }),
          }),
        }),
      });

      const mockDeadlineSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: mockDeadlineData, error: null }),
          }),
        }),
      });

      const mockNoteInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: noteId, deadline_progress: 0 }],
            error: null,
          }),
        }),
      });

      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return { select: mockProgressSelect };
        if (callCount === 2) return { select: mockDeadlineSelect };
        return { insert: mockNoteInsert };
      });

      await notesService.addNote(userId, deadlineId, noteText);

      expect(mockNoteInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          deadline_progress: 0,
        })
      );
    });
  });

  describe('addNote - with provided progress', () => {
    it('should use provided progress when passed', async () => {
      const providedProgress = 42;
      const mockCreatedNote = {
        id: noteId,
        note_text: noteText,
        deadline_progress: providedProgress,
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest
            .fn()
            .mockResolvedValue({ data: [mockCreatedNote], error: null }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert,
      });

      await notesService.addNote(
        userId,
        deadlineId,
        noteText,
        providedProgress
      );

      // Should NOT fetch progress from DB
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          deadline_progress: 42,
        })
      );
    });
  });

  describe('addNote - hashtag syncing', () => {
    it('should sync hashtags after creating note', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: noteId, note_text: noteText, deadline_progress: 50 }],
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({ insert: mockInsert });

      await notesService.addNote(userId, deadlineId, noteText, 50);

      expect(mockHashtagsService.syncNoteHashtags).toHaveBeenCalledWith(
        userId,
        noteId,
        noteText
      );
    });

    it('should not fail note creation if hashtag sync fails', async () => {
      mockHashtagsService.syncNoteHashtags.mockRejectedValue(
        new Error('Hashtag sync failed')
      );

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: noteId, note_text: noteText }],
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({ insert: mockInsert });

      // Should not throw
      await expect(
        notesService.addNote(userId, deadlineId, noteText, 50)
      ).resolves.not.toThrow();

      // Note should still be created
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('updateNote', () => {
    it('should update note and sync hashtags', async () => {
      const updatedText = 'Updated note with #newtag';
      const mockUpdatedNote = {
        id: noteId,
        note_text: updatedText,
        deadline_progress: 50,
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              limit: jest
                .fn()
                .mockResolvedValue({ data: [mockUpdatedNote], error: null }),
            }),
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        update: mockUpdate,
      });

      const result = await notesService.updateNote(noteId, userId, updatedText);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          note_text: updatedText,
        })
      );

      expect(mockHashtagsService.syncNoteHashtags).toHaveBeenCalledWith(
        userId,
        noteId,
        updatedText
      );

      expect(mockActivityService.trackUserActivity).toHaveBeenCalledWith(
        'note_updated',
        {
          noteId,
        }
      );

      expect(result).toEqual(mockUpdatedNote);
    });

    it('should not fail update if hashtag sync fails', async () => {
      mockHashtagsService.syncNoteHashtags.mockRejectedValue(
        new Error('Hashtag sync failed')
      );

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ id: noteId, note_text: noteText }],
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({ update: mockUpdate });

      // Should not throw
      await expect(
        notesService.updateNote(noteId, userId, noteText)
      ).resolves.not.toThrow();

      // Note should still be updated
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteNote', () => {
    it('should delete note and track activity', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockSupabaseFrom.mockReturnValue({
        delete: mockDelete,
      });

      const result = await notesService.deleteNote(noteId, userId);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('deadline_notes');
      expect(mockDelete).toHaveBeenCalled();

      expect(mockActivityService.trackUserActivity).toHaveBeenCalledWith(
        'note_deleted',
        {
          noteId,
        }
      );

      expect(result).toBe(noteId);
    });
  });
});
