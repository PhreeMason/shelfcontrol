-- Add type column and sync with deadline_type/source
-- This allows both old and new app versions to work simultaneously
--
-- Current state: rollback was applied, so deadline_type and source exist, but type does not
-- Target state: all three columns exist and stay in sync

-- Step 1: Add type column if it doesn't exist
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS type text;

-- Step 2: Copy data from deadline_type to type
UPDATE deadlines SET type = deadline_type WHERE type IS NULL;

-- Step 3: Drop old sync triggers (from original phase 1 migration)
DROP TRIGGER IF EXISTS sync_source_to_deadline_type_trigger ON deadlines;
DROP TRIGGER IF EXISTS sync_deadline_type_to_source_trigger ON deadlines;
DROP TRIGGER IF EXISTS sync_deadline_type_columns_trigger ON deadlines;
DROP FUNCTION IF EXISTS sync_source_to_deadline_type();
DROP FUNCTION IF EXISTS sync_deadline_type_to_source();
DROP FUNCTION IF EXISTS sync_deadline_type_columns();

-- Step 4: Create new sync function that keeps all three columns in sync
CREATE OR REPLACE FUNCTION sync_deadline_type_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- On insert, use whichever value is provided, preferring type > deadline_type > source
    NEW.type := COALESCE(NEW.type, NEW.deadline_type, NEW.source);
    NEW.deadline_type := NEW.type;
    NEW.source := NEW.type;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check which column changed and sync accordingly
    IF NEW.type IS DISTINCT FROM OLD.type AND NEW.type IS NOT NULL THEN
      NEW.deadline_type := NEW.type;
      NEW.source := NEW.type;
    ELSIF NEW.deadline_type IS DISTINCT FROM OLD.deadline_type AND NEW.deadline_type IS NOT NULL THEN
      NEW.type := NEW.deadline_type;
      NEW.source := NEW.deadline_type;
    ELSIF NEW.source IS DISTINCT FROM OLD.source AND NEW.source IS NOT NULL THEN
      NEW.type := NEW.source;
      NEW.deadline_type := NEW.source;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger
CREATE TRIGGER sync_deadline_type_columns_trigger
  BEFORE INSERT OR UPDATE ON deadlines
  FOR EACH ROW
  EXECUTE FUNCTION sync_deadline_type_columns();

-- Step 6: Create index on type column
CREATE INDEX IF NOT EXISTS deadlines_type_idx ON deadlines (type);

-- Step 7: Update CSV export function to use COALESCE for compatibility
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
    COALESCE(d.type, d.deadline_type, '') as type,
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
'Generates CSV export data for reading progress. Supports type, deadline_type, and source columns for backwards compatibility.';
