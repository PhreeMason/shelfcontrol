-- Migration: Add paused status to deadline_status_enum
-- Date: 2025-10-21
-- Description: Adds 'paused' status after 'reading' in deadline_status_enum

BEGIN;

-- Step 1: Rename old enum
ALTER TYPE deadline_status_enum RENAME TO deadline_status_enum_old;

-- Step 2: Create new enum with paused status added after reading
CREATE TYPE deadline_status_enum AS ENUM (
  'pending',
  'reading',
  'paused',
  'to_review',
  'complete',
  'did_not_finish'
);

-- Step 3: Update deadline_status table column to use new enum
ALTER TABLE deadline_status
  ALTER COLUMN status TYPE deadline_status_enum
  USING status::text::deadline_status_enum;

-- Step 4: Drop old enum
DROP TYPE deadline_status_enum_old;

COMMIT;
