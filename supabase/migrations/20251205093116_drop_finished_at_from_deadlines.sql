-- Rollback: Remove finished_at column from deadlines
-- This column was added in 20251203040800_add_finished_at_to_deadlines.sql
-- but the feature is being replaced with a more comprehensive edit history screen

ALTER TABLE deadlines DROP COLUMN IF EXISTS finished_at;
