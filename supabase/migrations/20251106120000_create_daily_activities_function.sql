-- Create function to get daily activities for calendar view
-- This aggregates all activity types into a single query for performance

CREATE OR REPLACE FUNCTION get_daily_activities(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  activity_date date,
  activity_type text,
  deadline_id text,
  book_title text,
  activity_timestamp timestamptz,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY

  -- Deadlines due on this date
  SELECT
    d.deadline_date::date as activity_date,
    'deadline_due'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    d.deadline_date as activity_timestamp,
    jsonb_build_object(
      'format', d.format,
      'author', d.author,
      'deadline_date', d.deadline_date
    ) as metadata
  FROM deadlines d
  WHERE d.user_id = p_user_id
    AND d.deadline_date::date >= p_start_date
    AND d.deadline_date::date <= p_end_date

  UNION ALL

  -- Deadlines created on this date
  SELECT
    d.created_at::date as activity_date,
    'deadline_created'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    d.created_at as activity_timestamp,
    jsonb_build_object(
      'format', d.format,
      'author', d.author
    ) as metadata
  FROM deadlines d
  WHERE d.user_id = p_user_id
    AND d.created_at::date >= p_start_date
    AND d.created_at::date <= p_end_date

  UNION ALL

  -- Progress updates on this date
  SELECT
    dp.created_at::date as activity_date,
    'progress'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    dp.created_at as activity_timestamp,
    jsonb_build_object(
      'current_progress', dp.current_progress,
      'time_spent_reading', dp.time_spent_reading,
      'format', d.format,
      'total_quantity', d.total_quantity
    ) as metadata
  FROM deadline_progress dp
  INNER JOIN deadlines d ON dp.deadline_id = d.id
  WHERE d.user_id = p_user_id
    AND dp.created_at::date >= p_start_date
    AND dp.created_at::date <= p_end_date
    AND dp.ignore_in_calcs = false

  UNION ALL

  -- Status changes on this date
  SELECT
    ds.created_at::date as activity_date,
    'status'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    ds.created_at as activity_timestamp,
    jsonb_build_object(
      'status', ds.status,
      'format', d.format
    ) as metadata
  FROM deadline_status ds
  INNER JOIN deadlines d ON ds.deadline_id = d.id
  WHERE d.user_id = p_user_id
    AND ds.created_at::date >= p_start_date
    AND ds.created_at::date <= p_end_date

  UNION ALL

  -- Notes added on this date
  SELECT
    dn.created_at::date as activity_date,
    'note'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    dn.created_at as activity_timestamp,
    jsonb_build_object(
      'note_text', LEFT(dn.note_text, 100),
      'note_id', dn.id,
      'format', d.format
    ) as metadata
  FROM deadline_notes dn
  INNER JOIN deadlines d ON dn.deadline_id = d.id
  WHERE d.user_id = p_user_id
    AND dn.created_at::date >= p_start_date
    AND dn.created_at::date <= p_end_date

  UNION ALL

  -- Platform posts on this date
  SELECT
    rp.posted_date::date as activity_date,
    'review'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    rp.posted_date as activity_timestamp,
    jsonb_build_object(
      'platform_name', rp.platform_name,
      'review_url', rp.review_url,
      'format', d.format
    ) as metadata
  FROM review_platforms rp
  INNER JOIN review_tracking rt ON rp.review_tracking_id = rt.id
  INNER JOIN deadlines d ON rt.deadline_id = d.id
  WHERE d.user_id = p_user_id
    AND rp.posted = true
    AND rp.posted_date IS NOT NULL
    AND rp.posted_date::date >= p_start_date
    AND rp.posted_date::date <= p_end_date

  ORDER BY activity_date DESC, activity_timestamp DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_daily_activities(uuid, date, date) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_daily_activities(uuid, date, date) IS
'Aggregates all user activities (deadlines due, deadlines created, progress updates, status changes, notes, reviews) for a date range. Used by calendar view for performance optimization.';
