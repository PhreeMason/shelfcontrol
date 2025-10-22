-- Migration: Create review_tracking and review_platforms tables
-- Date: 2025-10-15
-- Description: Creates tables to support review tracking workflow for the To Review feature

BEGIN;

-- 1. Create review_tracking table
CREATE TABLE IF NOT EXISTS review_tracking (
  id text NOT NULL PRIMARY KEY DEFAULT generate_prefixed_id('rt_'),
  deadline_id text NOT NULL UNIQUE REFERENCES deadlines(id) ON DELETE CASCADE,
  review_due_date timestamptz,
  needs_link_submission boolean DEFAULT FALSE,
  all_reviews_complete boolean DEFAULT FALSE,
  created_at timestamptz,
  updated_at timestamptz
);

-- 2. Create review_platforms table
CREATE TABLE IF NOT EXISTS review_platforms (
  id text NOT NULL PRIMARY KEY DEFAULT generate_prefixed_id('rp_'),
  review_tracking_id text NOT NULL REFERENCES review_tracking(id) ON DELETE CASCADE,
  platform_name text NOT NULL,
  posted boolean DEFAULT FALSE,
  posted_date timestamptz,
  review_url text,
  created_at timestamptz,
  updated_at timestamptz
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_tracking_deadline_id ON review_tracking(deadline_id);
CREATE INDEX IF NOT EXISTS idx_review_platforms_tracking_id ON review_platforms(review_tracking_id);
CREATE INDEX IF NOT EXISTS idx_review_platforms_posted ON review_platforms(posted);

-- 4. Add RLS policies
ALTER TABLE review_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_platforms ENABLE ROW LEVEL SECURITY;

-- Review tracking policies
CREATE POLICY "Users can view their own review tracking"
  ON review_tracking FOR SELECT
  USING (deadline_id IN (
    SELECT id FROM deadlines WHERE user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can insert their own review tracking"
  ON review_tracking FOR INSERT
  WITH CHECK (deadline_id IN (
    SELECT id FROM deadlines WHERE user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update their own review tracking"
  ON review_tracking FOR UPDATE
  USING (deadline_id IN (
    SELECT id FROM deadlines WHERE user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete their own review tracking"
  ON review_tracking FOR DELETE
  USING (deadline_id IN (
    SELECT id FROM deadlines WHERE user_id = (SELECT auth.uid())
  ));

-- Review platforms policies
CREATE POLICY "Users can view their own review platforms"
  ON review_platforms FOR SELECT
  USING (review_tracking_id IN (
    SELECT rt.id FROM review_tracking rt
    JOIN deadlines d ON rt.deadline_id = d.id
    WHERE d.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can insert their own review platforms"
  ON review_platforms FOR INSERT
  WITH CHECK (review_tracking_id IN (
    SELECT rt.id FROM review_tracking rt
    JOIN deadlines d ON rt.deadline_id = d.id
    WHERE d.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update their own review platforms"
  ON review_platforms FOR UPDATE
  USING (review_tracking_id IN (
    SELECT rt.id FROM review_tracking rt
    JOIN deadlines d ON rt.deadline_id = d.id
    WHERE d.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete their own review platforms"
  ON review_platforms FOR DELETE
  USING (review_tracking_id IN (
    SELECT rt.id FROM review_tracking rt
    JOIN deadlines d ON rt.deadline_id = d.id
    WHERE d.user_id = (SELECT auth.uid())
  ));

-- 5. Create triggers for handle_times on both tables
CREATE TRIGGER handle_times
  BEFORE INSERT OR UPDATE ON review_tracking
  FOR EACH ROW
  EXECUTE FUNCTION handle_times();

CREATE TRIGGER handle_times
  BEFORE INSERT OR UPDATE ON review_platforms
  FOR EACH ROW
  EXECUTE FUNCTION handle_times();

COMMIT;
