-- Phase 2: Cleanup migration for deadline form refactor
-- All users are now on the latest version, safe to remove backwards compatibility

-- First verify data integrity (deadline_type should have all data from source)
DO $$
DECLARE
  missing_data_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO missing_data_count
  FROM deadlines
  WHERE source IS NOT NULL
    AND (deadline_type IS NULL OR deadline_type = '');

  IF missing_data_count > 0 THEN
    RAISE EXCEPTION 'Data integrity check failed: % rows have source but no deadline_type', missing_data_count;
  END IF;
END $$;

-- Drop the bidirectional sync triggers (must drop before functions)
DROP TRIGGER IF EXISTS sync_source_to_deadline_type_trigger ON deadlines;
DROP TRIGGER IF EXISTS sync_deadline_type_to_source_trigger ON deadlines;

-- Drop the trigger functions
DROP FUNCTION IF EXISTS sync_source_to_deadline_type();
DROP FUNCTION IF EXISTS sync_deadline_type_to_source();

-- Drop the old index on deadline_type (will recreate on 'type')
DROP INDEX IF EXISTS deadlines_deadline_type_idx;

-- Rename deadline_type to type
ALTER TABLE deadlines RENAME COLUMN deadline_type TO type;

-- Drop the old source column
ALTER TABLE deadlines DROP COLUMN IF EXISTS source;

-- Recreate index on new 'type' column
CREATE INDEX deadlines_type_idx ON deadlines (type);

-- Update CSV export function to use 'type' instead of 'source'
CREATE OR REPLACE FUNCTION get_reading_progress_csv(p_user_id uuid)
RETURNS TABLE (
  book_title text,
  author text,
  format text,
  total_quantity integer,
  unit text,
  current_progress numeric,
  status text,
  deadline_date text,
  flexibility text,
  type text,
  created_date text,
  completed_date text,
  last_progress_update text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_progress AS (
    SELECT DISTINCT ON (dp.deadline_id)
      dp.deadline_id,
      dp.current_progress,
      dp.updated_at as progress_updated_at
    FROM deadline_progress dp
    ORDER BY dp.deadline_id, dp.updated_at DESC
  ),
  latest_status AS (
    SELECT DISTINCT ON (ds.deadline_id)
      ds.deadline_id,
      ds.status,
      ds.created_at as status_created_at
    FROM deadline_status ds
    ORDER BY ds.deadline_id, ds.created_at DESC
  )
  SELECT
    d.book_title,
    d.author,
    d.format::text,
    d.total_quantity,
    CASE
      WHEN d.format = 'audio' THEN 'minutes'
      ELSE 'pages'
    END as unit,
    COALESCE(lp.current_progress, 0) as current_progress,
    COALESCE(ls.status::text, 'reading') as status,
    TO_CHAR(d.deadline_date AT TIME ZONE 'UTC', 'YYYY-MM-DD') as deadline_date,
    d.flexibility::text,
    d.type,
    TO_CHAR(d.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') as created_date,
    CASE
      WHEN ls.status = 'complete' THEN
        TO_CHAR(ls.status_created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ELSE ''
    END as completed_date,
    CASE
      WHEN lp.progress_updated_at IS NOT NULL THEN
        TO_CHAR(lp.progress_updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ELSE ''
    END as last_progress_update
  FROM deadlines d
  LEFT JOIN latest_progress lp ON d.id = lp.deadline_id
  LEFT JOIN latest_status ls ON d.id = ls.deadline_id
  WHERE d.user_id = p_user_id
  ORDER BY d.deadline_date ASC, d.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_reading_progress_csv(uuid) IS
"Generates CSV export data for a users reading progress including deadlines and current progress. Dynamic fields like progress percentage and pages per day should be calculated in the spreadsheet.";
