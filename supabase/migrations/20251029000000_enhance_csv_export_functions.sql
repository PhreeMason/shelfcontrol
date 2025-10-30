DROP FUNCTION IF EXISTS get_reading_progress_csv(uuid);

CREATE OR REPLACE FUNCTION get_review_platforms_csv(p_user_id uuid)
RETURNS TABLE (
  book_title text,
  deadline_id text,
  platform_name text,
  posted boolean,
  posted_date text,
  review_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.book_title,
    d.id as deadline_id,
    rp.platform_name,
    rp.posted,
    CASE
      WHEN rp.posted_date IS NOT NULL THEN
        TO_CHAR(rp.posted_date AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ELSE ''
    END as posted_date,
    COALESCE(rp.review_url, '') as review_url
  FROM deadlines d
  INNER JOIN review_tracking rt ON d.id = rt.deadline_id
  INNER JOIN review_platforms rp ON rt.id = rp.review_tracking_id
  WHERE d.user_id = p_user_id
  ORDER BY d.deadline_date ASC, d.book_title, rp.platform_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_review_platforms_csv(uuid) TO authenticated;

COMMENT ON FUNCTION get_review_platforms_csv(uuid) IS
'Generates CSV export data for review platforms associated with user deadlines. Includes book title and deadline_id for easy matching with progress data.';

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
    COALESCE(d.type, d.deadline_type) as type,
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
'Generates comprehensive CSV export data for a user''s reading progress including deadlines, progress, tags, contacts, disclosure info, and review tracking. Dynamic fields like progress percentage and pages per day should be calculated in the spreadsheet.';
