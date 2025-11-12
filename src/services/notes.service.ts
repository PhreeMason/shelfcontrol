import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';
import { DeadlineNote } from '@/types/notes.types';
import { activityService } from './activity.service';
import { hashtagsService } from './hashtags.service';

class NotesService {
  async getNotes(userId: string, deadlineId: string): Promise<DeadlineNote[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_NOTES)
      .select('*')
      .eq('user_id', userId)
      .eq('deadline_id', deadlineId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DeadlineNote[];
  }

  async addNote(
    userId: string,
    deadlineId: string,
    noteText: string,
    deadlineProgress?: number
  ): Promise<DeadlineNote> {
    const finalNoteId = generateId('dn');

    let progressPercentage = deadlineProgress;

    if (progressPercentage === undefined) {
      const { data: progressResults } = await supabase
        .from(DB_TABLES.DEADLINE_PROGRESS)
        .select('current_progress')
        .eq('deadline_id', deadlineId)
        .order('created_at', { ascending: false })
        .limit(1);

      const currentProgress = progressResults?.[0]?.current_progress || 0;

      const { data: deadlineData } = await supabase
        .from(DB_TABLES.DEADLINES)
        .select('total_quantity')
        .eq('id', deadlineId)
        .eq('user_id', userId)
        .single();

      const totalQuantity = deadlineData?.total_quantity || 0;

      progressPercentage = totalQuantity
        ? Math.round((currentProgress / totalQuantity) * 100)
        : 0;
    }

    const insertPayload = {
      id: finalNoteId,
      user_id: userId,
      deadline_id: deadlineId,
      note_text: noteText,
      deadline_progress: progressPercentage,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.DEADLINE_NOTES)
      .insert(insertPayload)
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) {
      console.error('🔴 [notesService.addNote] Insert error:', error);
      throw error;
    }

    // Sync hashtags from note text
    try {
      await hashtagsService.syncNoteHashtags(userId, finalNoteId, noteText);
    } catch (hashtagError) {
      // Log error but don't fail the note creation
      console.error('Failed to sync hashtags for note:', hashtagError);
    }

    activityService.trackUserActivity('note_created', {
      deadlineId,
      noteId: finalNoteId,
    });

    return data as DeadlineNote;
  }

  async updateNote(
    noteId: string,
    userId: string,
    noteText: string
  ): Promise<DeadlineNote> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_NOTES)
      .update({
        note_text: noteText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .limit(1);

    if (error) throw error;

    // Sync hashtags from updated note text
    try {
      await hashtagsService.syncNoteHashtags(userId, noteId, noteText);
    } catch (hashtagError) {
      // Log error but don't fail the note update
      console.error('Failed to sync hashtags for note:', hashtagError);
    }

    activityService.trackUserActivity('note_updated', {
      noteId,
    });

    return data?.[0] as DeadlineNote;
  }

  async deleteNote(noteId: string, userId: string): Promise<string> {
    const { error } = await supabase
      .from(DB_TABLES.DEADLINE_NOTES)
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) throw error;

    activityService.trackUserActivity('note_deleted', {
      noteId,
    });

    return noteId;
  }
}

export const notesService = new NotesService();
