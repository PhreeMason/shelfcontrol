-- Migration: Add rejected and withdrew to deadline_status_enum
  -- Description: Adds 'rejected' and 'withdrew' statuses to deadline_status_enum

  BEGIN;

  -- Step 1: Rename old enum
  ALTER TYPE deadline_status_enum RENAME TO deadline_status_enum_old;

  -- Step 2: Create new enum with rejected and withdrew added
  CREATE TYPE deadline_status_enum AS ENUM (
    'pending',
    'reading',
    'paused',
    'to_review',
    'complete',
    'rejected',
    'withdrew',
    'did_not_finish'
  );

  -- Step 3: Update deadline_status table column to use new enum
  ALTER TABLE deadline_status
    ALTER COLUMN status TYPE deadline_status_enum
    USING status::text::deadline_status_enum;

  -- Step 4: Drop old enum
  DROP TYPE deadline_status_enum_old;

  COMMIT;