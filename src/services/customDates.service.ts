import { DB_TABLES } from '@/constants/database';
import { generateId, supabase } from '@/lib/supabase';
import {
  DeadlineCustomDate,
  DeadlineCustomDateUpdate,
} from '@/types/customDates.types';
import { activityService } from './activity.service';

class CustomDatesService {
  async getCustomDates(
    userId: string,
    deadlineId: string
  ): Promise<DeadlineCustomDate[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_CUSTOM_DATES as any)
      .select('*')
      .eq('user_id', userId)
      .eq('deadline_id', deadlineId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data as unknown as DeadlineCustomDate[];
  }

  async getAllCustomDateNames(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_CUSTOM_DATES as any)
      .select('name')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;

    const uniqueNames = [
      ...new Set((data as { name: string }[]).map(d => d.name)),
    ];
    return uniqueNames;
  }

  async addCustomDate(
    userId: string,
    deadlineId: string,
    customDateData: { name: string; date: string }
  ): Promise<DeadlineCustomDate> {
    const finalCustomDateId = generateId('dcd');

    const { data: insertResults, error } = await supabase
      .from(DB_TABLES.DEADLINE_CUSTOM_DATES as any)
      .insert({
        id: finalCustomDateId,
        user_id: userId,
        deadline_id: deadlineId,
        name: customDateData.name,
        date: customDateData.date,
      })
      .select()
      .limit(1);

    const data = insertResults?.[0];

    if (error) throw error;

    activityService.trackUserActivity('custom_date_created', {
      deadlineId,
      customDateId: finalCustomDateId,
      name: customDateData.name,
    });

    return data as unknown as DeadlineCustomDate;
  }

  async updateCustomDate(
    customDateId: string,
    userId: string,
    customDateData: DeadlineCustomDateUpdate
  ): Promise<DeadlineCustomDate> {
    const { data, error } = await supabase
      .from(DB_TABLES.DEADLINE_CUSTOM_DATES as any)
      .update({
        ...customDateData,
      })
      .eq('id', customDateId)
      .eq('user_id', userId)
      .select()
      .limit(1);

    if (error) throw error;

    activityService.trackUserActivity('custom_date_updated', {
      customDateId,
    });

    return data?.[0] as unknown as DeadlineCustomDate;
  }

  async deleteCustomDate(
    customDateId: string,
    userId: string
  ): Promise<string> {
    const { error } = await supabase
      .from(DB_TABLES.DEADLINE_CUSTOM_DATES as any)
      .delete()
      .eq('id', customDateId)
      .eq('user_id', userId);

    if (error) throw error;

    activityService.trackUserActivity('custom_date_deleted', {
      customDateId,
    });

    return customDateId;
  }
}

export const customDatesService = new CustomDatesService();
