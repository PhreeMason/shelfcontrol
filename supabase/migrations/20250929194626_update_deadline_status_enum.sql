-- Migration: Update deadline_status_enum values
-- Changes:
--   'requested' -> 'pending'
--   'set_aside' -> 'paused'
--   Remove: 'approved', 'rejected', 'withdrew'
--   Add: 'did_not_finish'
--   Keep: 'reading', 'complete'

-- Since PostgreSQL doesn't allow removing enum values and requires separate transactions
-- for ADD VALUE, we'll create a new enum type and migrate to it directly

-- Step 1: Create new enum type with the desired values
CREATE TYPE deadline_status_enum_new AS ENUM (
  'pending',
  'reading',
  'paused',
  'complete',
  'did_not_finish'
);

-- Step 2: Add a temporary column with the new type
ALTER TABLE deadline_status ADD COLUMN status_new deadline_status_enum_new;

-- Step 3: Migrate data from old column to new column with value mapping
UPDATE deadline_status
SET status_new = CASE
  WHEN status = 'requested' THEN 'pending'::deadline_status_enum_new
  WHEN status = 'set_aside' THEN 'paused'::deadline_status_enum_new
  WHEN status = 'reading' THEN 'reading'::deadline_status_enum_new
  WHEN status = 'complete' THEN 'complete'::deadline_status_enum_new
  ELSE 'reading'::deadline_status_enum_new
END;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE deadline_status DROP COLUMN status;
ALTER TABLE deadline_status RENAME COLUMN status_new TO status;

-- Step 5: Drop the old enum type and rename the new one
DROP TYPE deadline_status_enum;
ALTER TYPE deadline_status_enum_new RENAME TO deadline_status_enum;