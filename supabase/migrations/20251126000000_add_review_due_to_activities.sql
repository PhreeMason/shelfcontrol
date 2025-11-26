-- Add review_due to get_daily_activities
-- This allows showing review due dates in the calendar

DROP FUNCTION IF EXISTS get_daily_activities(uuid, date, date);

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
  WITH latest_status AS (
    SELECT DISTINCT ON (ds.deadline_id)
      ds.deadline_id,
      ds.status,
      ds.created_at as status_created_at
    FROM deadline_status ds
    ORDER BY ds.deadline_id, ds.created_at DESC
  ),

  -- Add previous progress values using LAG window function
  progress_with_previous AS (
    SELECT
      dp.id,
      dp.deadline_id,
      dp.created_at,
      dp.current_progress,
      dp.time_spent_reading,
      LAG(dp.current_progress) OVER (
        PARTITION BY dp.deadline_id
        ORDER BY dp.created_at, dp.id
      ) as previous_progress
    FROM deadline_progress dp
    WHERE dp.ignore_in_calcs = false
  ),

  -- Add previous status values using LAG window function
  status_with_previous AS (
    SELECT
      ds.id,
      ds.deadline_id,
      ds.created_at,
      ds.status,
      LAG(ds.status::text) OVER (
        PARTITION BY ds.deadline_id
        ORDER BY ds.created_at, ds.id
      ) as previous_status
    FROM deadline_status ds
  )

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
      'deadline_date', d.deadline_date,
      'status', COALESCE(ls.status::text, 'reading')
    ) as metadata
  FROM deadlines d
  LEFT JOIN latest_status ls ON d.id = ls.deadline_id
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

  -- Progress updates on this date (now with previous_progress)
  SELECT
    pwp.created_at::date as activity_date,
    'progress'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    pwp.created_at as activity_timestamp,
    jsonb_build_object(
      'current_progress', pwp.current_progress,
      'previous_progress', pwp.previous_progress,
      'time_spent_reading', pwp.time_spent_reading,
      'format', d.format,
      'total_quantity', d.total_quantity
    ) as metadata
  FROM progress_with_previous pwp
  INNER JOIN deadlines d ON pwp.deadline_id = d.id
  WHERE d.user_id = p_user_id
    AND pwp.created_at::date >= p_start_date
    AND pwp.created_at::date <= p_end_date

  UNION ALL

  -- Status changes on this date (now with previous_status)
  SELECT
    swp.created_at::date as activity_date,
    'status'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    swp.created_at as activity_timestamp,
    jsonb_build_object(
      'status', swp.status::text,
      'previous_status', swp.previous_status,
      'format', d.format
    ) as metadata
  FROM status_with_previous swp
  INNER JOIN deadlines d ON swp.deadline_id = d.id
  WHERE d.user_id = p_user_id
    AND swp.created_at::date >= p_start_date
    AND swp.created_at::date <= p_end_date

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

  UNION ALL

  -- Review due dates
  SELECT
    rt.review_due_date::date as activity_date,
    'review_due'::text as activity_type,
    d.id as deadline_id,
    d.book_title,
    rt.review_due_date as activity_timestamp,
    jsonb_build_object(
      'format', d.format,
      'author', d.author,
      'review_due_date', rt.review_due_date
    ) as metadata
  FROM review_tracking rt
  INNER JOIN deadlines d ON rt.deadline_id = d.id
  WHERE d.user_id = p_user_id
    AND rt.review_due_date IS NOT NULL
    AND rt.review_due_date::date >= p_start_date
    AND rt.review_due_date::date <= p_end_date

  ORDER BY activity_date DESC, activity_timestamp DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_daily_activities(uuid, date, date) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_daily_activities(uuid, date, date) IS
'Aggregates all user activities (deadlines due, deadlines created, progress updates, status changes, notes, reviews, review due dates) for a date range. Includes previous_progress and previous_status for showing deltas and transitions. Used by calendar view for performance optimization.';
