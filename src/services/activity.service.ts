import { DB_TABLES } from '@/constants/database';
import { supabase } from '@/lib/supabase';

class ActivityService {
  async trackUserActivity(
    activityType: string,
    data: Record<string, any> = {},
    userId?: string
  ) {
    try {
      let finalUserId = userId;

      if (!finalUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }
        finalUserId = user.id;
      }

      void supabase
        .from(DB_TABLES.USER_ACTIVITIES)
        .insert([
          {
            user_id: finalUserId,
            activity_type: activityType,
            activity_data: data,
            timestamp: new Date().toISOString(),
          },
        ])
        .then(({ error }) => {
          if (error) {
            console.error('Failed to track user activity:', error);
          }
        });
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }
}

export const activityService = new ActivityService();
