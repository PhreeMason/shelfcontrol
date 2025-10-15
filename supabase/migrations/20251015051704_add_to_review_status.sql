-- Migration: Update deadline_status_enum - Add to_review, Remove paused
-- Date: 2025-10-15
-- Description: Adds 'to_review' and removes 'paused' from deadline_status_enum

BEGIN;

-- Step 1: Migrate existing paused books to reading in deadline_status table
UPDATE deadline_status
SET status = 'reading'
WHERE status = 'paused';

-- Step 2: Rename old enum
ALTER TYPE deadline_status_enum RENAME TO deadline_status_enum_old;

-- Step 3: Create new enum with desired values (no paused, includes to_review)
CREATE TYPE deadline_status_enum AS ENUM (
  'pending',
  'reading',
  'to_review',
  'complete',
  'did_not_finish'
);

-- Step 4: Update deadline_status table column to use new enum
ALTER TABLE deadline_status
  ALTER COLUMN status TYPE deadline_status_enum
  USING status::text::deadline_status_enum;

-- Step 5: Drop old enum
DROP TYPE deadline_status_enum_old;

COMMIT;
