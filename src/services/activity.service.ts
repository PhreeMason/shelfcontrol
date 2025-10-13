import { generateId, supabase } from '@/lib/supabase';
import { DB_TABLES } from '@/constants/database';

class ActivityService {
  async trackUserActivity(
    activityType: string,
    data: Record<string, any> = {}
  ) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const activityId = generateId('ua');

      const { error } = await supabase.from(DB_TABLES.USER_ACTIVITIES).insert([
        {
          id: activityId,
          user_id: user.id,
          activity_type: activityType,
          activity_data: data,
          timestamp: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Failed to track user activity:', error);
      }
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }
}

export const activityService = new ActivityService();
