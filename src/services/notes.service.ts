import { generateId, supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/constants/database';
import { DeadlineNote } from '@/types/notes.types';
import { activityService } from './activity.service';

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
    deadlineProgress: number
  ): Promise<DeadlineNote> {
    const finalNoteId = generateId('dn');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.DEADLINE_NOTES)
      .insert({
        id: finalNoteId,
        user_id: userId,
        deadline_id: deadlineId,
        note_text: noteText,
        deadline_progress: deadlineProgress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('note_created', {
      deadlineId,
      noteId: finalNoteId,
    });

    return data as DeadlineNote;
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
