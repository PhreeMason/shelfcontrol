-- Phase 3: Cleanup migration - Remove legacy columns
-- ONLY RUN AFTER all users have updated to app versions using 'type'
-- All users confirmed on version 1.58.0+

-- Safety check: Verify all data is synced
DO $$
DECLARE
  unsynced_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unsynced_count
  FROM deadlines
  WHERE type IS DISTINCT FROM deadline_type
    OR type IS DISTINCT FROM source;

  IF unsynced_count > 0 THEN
    RAISE EXCEPTION 'Data sync check failed: % rows have mismatched values. Aborting cleanup.', unsynced_count;
  END IF;
END $$;

-- Drop sync trigger and function
DROP TRIGGER IF EXISTS sync_deadline_type_columns_trigger ON deadlines;
DROP FUNCTION IF EXISTS sync_deadline_type_columns();

-- Drop legacy columns
ALTER TABLE deadlines DROP COLUMN IF EXISTS deadline_type;
ALTER TABLE deadlines DROP COLUMN IF EXISTS source;

-- Drop legacy index
DROP INDEX IF EXISTS deadlines_deadline_type_idx;

-- Update CSV export function to remove COALESCE fallbacks (no longer needed)
DROP FUNCTION IF EXISTS get_reading_progress_csv(uuid);

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
  acquisition_source text,
  publishers text,
  tags text,
  contact_name text,
  contact_email text,
  contact_username text,
  disclosure_text text,
  disclosure_source_name text,
  review_due_date text,
  needs_link_submission boolean,
  all_reviews_complete boolean,
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
  ),
  deadline_tags_agg AS (
    SELECT
      dt.deadline_id,
      STRING_AGG(t.name, '|' ORDER BY t.name) as tags
    FROM deadline_tags dt
    INNER JOIN tags t ON dt.tag_id = t.id
    GROUP BY dt.deadline_id
  ),
  deadline_contacts_agg AS (
    SELECT DISTINCT ON (dc.deadline_id)
      dc.deadline_id,
      dc.contact_name,
      dc.email,
      dc.username
    FROM deadline_contacts dc
    ORDER BY dc.deadline_id, dc.created_at DESC
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
    COALESCE(d.acquisition_source, '') as acquisition_source,
    COALESCE(array_to_string(d.publishers, '|'), '') as publishers,
    COALESCE(dta.tags, '') as tags,
    COALESCE(dca.contact_name, '') as contact_name,
    COALESCE(dca.email, '') as contact_email,
    COALESCE(dca.username, '') as contact_username,
    COALESCE(d.disclosure_text, '') as disclosure_text,
    COALESCE(d.disclosure_source_name, '') as disclosure_source_name,
    CASE
      WHEN rt.review_due_date IS NOT NULL THEN
        TO_CHAR(rt.review_due_date AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ELSE ''
    END as review_due_date,
    COALESCE(rt.needs_link_submission, false) as needs_link_submission,
    COALESCE(rt.all_reviews_complete, false) as all_reviews_complete,
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
  LEFT JOIN deadline_tags_agg dta ON d.id = dta.deadline_id
  LEFT JOIN deadline_contacts_agg dca ON d.id = dca.deadline_id
  LEFT JOIN review_tracking rt ON d.id = rt.deadline_id
  WHERE d.user_id = p_user_id
  ORDER BY d.deadline_date ASC, d.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_reading_progress_csv(uuid) IS
'Generates CSV export data for reading progress. Uses type column only (legacy deadline_type and source columns removed).';

-- Verify final state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deadlines' AND column_name = 'type'
  ) THEN
    RAISE EXCEPTION 'Cleanup verification failed: type column does not exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deadlines' AND column_name = 'deadline_type'
  ) THEN
    RAISE EXCEPTION 'Cleanup verification failed: deadline_type column still exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deadlines' AND column_name = 'source'
  ) THEN
    RAISE EXCEPTION 'Cleanup verification failed: source column still exists';
  END IF;
END $$;
