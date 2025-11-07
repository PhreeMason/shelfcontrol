import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';
import { Hashtag, HashtagInsert, NoteHashtag } from '@/types/hashtags.types';
import {
  extractHashtags,
  getNextHashtagColor,
  MAX_HASHTAGS_PER_NOTE,
} from '@/utils/hashtagUtils';
import { activityService } from './activity.service';

export class HashtagLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HashtagLimitError';
  }
}

class HashtagsService {
  /**
   * Get all hashtags for a user
   */
  async getAllHashtags(userId: string): Promise<Hashtag[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.HASHTAGS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data as unknown as Hashtag[];
  }

  /**
   * Get hashtags for a specific note
   */
  async getNoteHashtags(userId: string, noteId: string): Promise<Hashtag[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.NOTE_HASHTAGS)
      .select(
        `
        *,
        hashtags:hashtag_id (*)
      `
      )
      .eq('user_id', userId)
      .eq('note_id', noteId);

    if (error) throw error;

    const hashtags = data.map((nh: any) => nh.hashtags);

    return hashtags as unknown as Hashtag[];
  }

  /**
   * Get all note-hashtag relationships for a specific deadline
   * (useful for filtering notes by hashtags)
   */
  async getAllNoteHashtags(
    userId: string,
    deadlineId: string
  ): Promise<NoteHashtag[]> {
    // Use a single query with JOIN to get note-hashtag relationships
    const { data, error } = await supabase
      .from(DB_TABLES.NOTE_HASHTAGS)
      .select(
        `
        *,
        note:note_id!inner (
          deadline_id
        )
      `
      )
      .eq('user_id', userId)
      .eq('note.deadline_id', deadlineId);

    if (error) throw error;

    return (data || []) as unknown as NoteHashtag[];
  }

  /**
   * Create a new hashtag
   */
  async createHashtag(
    userId: string,
    hashtagData: HashtagInsert
  ): Promise<Hashtag> {
    const finalHashtagId = generateId('ht');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.HASHTAGS)
      .insert({
        id: finalHashtagId,
        user_id: userId,
        name: hashtagData.name.toLowerCase(),
        color: hashtagData.color,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('hashtag_created', {
      hashtagId: finalHashtagId,
      hashtagName: hashtagData.name,
    });

    return data as unknown as Hashtag;
  }

  /**
   * Add a hashtag to a note
   */
  async addHashtagToNote(
    userId: string,
    noteId: string,
    hashtagId: string
  ): Promise<NoteHashtag> {
    const finalId = generateId('nht');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.NOTE_HASHTAGS)
      .insert({
        id: finalId,
        user_id: userId,
        note_id: noteId,
        hashtag_id: hashtagId,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('hashtag_added_to_note', {
      noteId,
      hashtagId,
    });

    return data as unknown as NoteHashtag;
  }

  /**
   * Remove a hashtag from a note
   */
  async removeHashtagFromNote(
    userId: string,
    noteId: string,
    hashtagId: string
  ): Promise<string> {
    const { error } = await supabase
      .from(DB_TABLES.NOTE_HASHTAGS)
      .delete()
      .eq('user_id', userId)
      .eq('note_id', noteId)
      .eq('hashtag_id', hashtagId);

    if (error) throw error;

    activityService.trackUserActivity('hashtag_removed_from_note', {
      noteId,
      hashtagId,
    });

    return hashtagId;
  }

  /**
   * Delete a hashtag
   */
  async deleteHashtag(userId: string, hashtagId: string): Promise<string> {
    const { error } = await supabase
      .from(DB_TABLES.HASHTAGS)
      .delete()
      .eq('id', hashtagId)
      .eq('user_id', userId);

    if (error) throw error;

    activityService.trackUserActivity('hashtag_deleted', {
      hashtagId,
    });

    return hashtagId;
  }

  /**
   * Sync note hashtags based on note text
   * This is the key function that extracts hashtags from text and updates the database
   */
  async syncNoteHashtags(
    userId: string,
    noteId: string,
    noteText: string
  ): Promise<void> {
    // Extract hashtags from note text
    const hashtagNames = extractHashtags(noteText);

    // Check hashtag limit
    if (hashtagNames.length > MAX_HASHTAGS_PER_NOTE) {
      throw new HashtagLimitError(
        `Notes can have a maximum of ${MAX_HASHTAGS_PER_NOTE} hashtags. You have ${hashtagNames.length} hashtags.`
      );
    }

    // Get all existing hashtags for this user
    const existingHashtags = await this.getAllHashtags(userId);
    const existingHashtagsMap = new Map(
      existingHashtags.map(h => [h.name.toLowerCase(), h])
    );

    // Get current note hashtags
    const currentNoteHashtags = await this.getNoteHashtags(userId, noteId);
    const currentHashtagIds = new Set(currentNoteHashtags.map(h => h.id));

    // Create any new hashtags that don't exist (batch operation)
    const hashtagsToCreate: string[] = [];
    for (const name of hashtagNames) {
      if (!existingHashtagsMap.has(name.toLowerCase())) {
        hashtagsToCreate.push(name);
      }
    }

    if (hashtagsToCreate.length > 0) {
      const usedColors = existingHashtags.map(item => item.color);
      const newHashtagsData = hashtagsToCreate.map(name => {
        const color = getNextHashtagColor(usedColors);
        usedColors.push(color);
        return {
          id: generateId('ht'),
          user_id: userId,
          name: name.toLowerCase(),
          color,
        };
      });

      // Batch insert new hashtags
      const { data: insertedHashtags, error: insertError } = await supabase
        .from(DB_TABLES.HASHTAGS)
        .insert(newHashtagsData)
        .select();

      if (insertError) throw insertError;

      // Track activity for each created hashtag
      newHashtagsData.forEach(ht => {
        activityService.trackUserActivity('hashtag_created', {
          hashtagId: ht.id,
          hashtagName: ht.name,
        });
      });

      // Update map with new hashtags
      (insertedHashtags as unknown as Hashtag[]).forEach(ht => {
        existingHashtagsMap.set(ht.name.toLowerCase(), ht);
      });
    }

    // Determine which hashtags to add and remove
    const hashtagsInText = new Set(
      hashtagNames
        .map(name => existingHashtagsMap.get(name.toLowerCase())?.id)
        .filter(Boolean) as string[]
    );

    // Batch remove hashtags no longer in text
    const hashtagsToRemove = [...currentHashtagIds].filter(
      id => !hashtagsInText.has(id)
    );
    if (hashtagsToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from(DB_TABLES.NOTE_HASHTAGS)
        .delete()
        .eq('user_id', userId)
        .eq('note_id', noteId)
        .in('hashtag_id', hashtagsToRemove);

      if (removeError) throw removeError;

      // Track activity for removed hashtags
      hashtagsToRemove.forEach(hashtagId => {
        activityService.trackUserActivity('hashtag_removed_from_note', {
          noteId,
          hashtagId,
        });
      });

      // Trigger silent cleanup of orphaned hashtags
      void this.cleanupOrphanedHashtags(userId);
    }

    // Batch add new hashtags
    const hashtagsToAdd = [...hashtagsInText].filter(
      id => !currentHashtagIds.has(id)
    );
    if (hashtagsToAdd.length > 0) {
      const noteHashtagsData = hashtagsToAdd.map(hashtagId => ({
        id: generateId('nht'),
        user_id: userId,
        note_id: noteId,
        hashtag_id: hashtagId,
      }));

      const { error: addError } = await supabase
        .from(DB_TABLES.NOTE_HASHTAGS)
        .insert(noteHashtagsData);

      if (addError) throw addError;

      // Track activity for added hashtags
      hashtagsToAdd.forEach(hashtagId => {
        activityService.trackUserActivity('hashtag_added_to_note', {
          noteId,
          hashtagId,
        });
      });
    }
  }

  /**
   * Cleanup hashtags that are not associated with any notes
   * Runs silently in the background without blocking UI
   */
  async cleanupOrphanedHashtags(userId: string): Promise<void> {
    try {
      // Find hashtags with no note associations
      const { data: orphanedHashtags, error: queryError } = await supabase
        .from(DB_TABLES.HASHTAGS)
        .select(
          `
          id,
          note_hashtags:${DB_TABLES.NOTE_HASHTAGS}(hashtag_id)
        `
        )
        .eq('user_id', userId);

      if (queryError) throw queryError;

      // Filter to find hashtags with no associations
      const hashtagsToDelete = (orphanedHashtags as any[])
        .filter(ht => !ht.note_hashtags || ht.note_hashtags.length === 0)
        .map(ht => ht.id);

      if (hashtagsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from(DB_TABLES.HASHTAGS)
          .delete()
          .eq('user_id', userId)
          .in('id', hashtagsToDelete);

        if (deleteError) throw deleteError;

        // Track cleanup activity
        activityService.trackUserActivity('hashtags_cleaned_up', {
          count: hashtagsToDelete.length,
        });
      }
    } catch (error) {
      // Silent failure - log but don't propagate error
      console.error('Failed to cleanup orphaned hashtags:', error);
    }
  }
}

export const hashtagsService = new HashtagsService();
