import { DB_TABLES } from '@/constants/database';
import { supabase } from '@/lib/supabase';

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

      const { error } = await supabase.from(DB_TABLES.USER_ACTIVITIES).insert([
        {
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
