import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';
import {
  DeadlineTag,
  Tag,
  TagInsert,
  TagWithDetails,
} from '@/types/tags.types';
import { activityService } from './activity.service';

class TagsService {
  async getAllTags(userId: string): Promise<TagWithDetails[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.TAGS as any)
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tags = (data as unknown as Tag[]).map(tag => ({
      ...tag,
      isSystemTag: tag.user_id === null,
    }));

    return tags;
  }

  async getDeadlineTags(
    userId: string,
    deadlineId: string
  ): Promise<TagWithDetails[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_TAGS as any)
      .select(
        `
        *,
        tags:tag_id (*)
      `
      )
      .eq('user_id', userId)
      .eq('deadline_id', deadlineId);

    if (error) throw error;

    const tags = data.map((dt: any) => ({
      ...dt.tags,
      isSystemTag: dt.tags.user_id === null,
    }));

    return tags;
  }

  async getAllDeadlineTags(userId: string): Promise<DeadlineTag[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_TAGS as any)
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data as unknown as DeadlineTag[];
  }

  async createTag(userId: string, tagData: TagInsert): Promise<Tag> {
    const finalTagId = generateId('tg');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.TAGS as any)
      .insert({
        id: finalTagId,
        user_id: userId,
        name: tagData.name,
        color: tagData.color,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('tag_created', {
      tagId: finalTagId,
      tagName: tagData.name,
    });

    return data as unknown as Tag;
  }

  async addTagToDeadline(
    userId: string,
    deadlineId: string,
    tagId: string
  ): Promise<DeadlineTag> {
    const finalId = generateId('dtg');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.DEADLINE_TAGS as any)
      .insert({
        id: finalId,
        user_id: userId,
        deadline_id: deadlineId,
        tag_id: tagId,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('tag_added_to_deadline', {
      deadlineId,
      tagId,
    });

    return data as unknown as DeadlineTag;
  }

  async removeTagFromDeadline(
    userId: string,
    deadlineId: string,
    tagId: string
  ): Promise<string> {
    const { error } = await supabase
      .from(DB_TABLES.DEADLINE_TAGS as any)
      .delete()
      .eq('user_id', userId)
      .eq('deadline_id', deadlineId)
      .eq('tag_id', tagId);

    if (error) throw error;

    activityService.trackUserActivity('tag_removed_from_deadline', {
      deadlineId,
      tagId,
    });

    return tagId;
  }

  async deleteTag(userId: string, tagId: string): Promise<string> {
    const { error } = await supabase
      .from(DB_TABLES.TAGS as any)
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);

    if (error) throw error;

    activityService.trackUserActivity('tag_deleted', {
      tagId,
    });

    return tagId;
  }
}

export const tagsService = new TagsService();
