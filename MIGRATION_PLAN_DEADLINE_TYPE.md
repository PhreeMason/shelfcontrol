# Migration Plan: deadline_type → type Column Rename

## Current Situation

### What Happened
1. **Phase 2 migration** (`20251028120000`) renamed `deadline_type` → `type` and dropped `source`
2. **Old app users** on versions using `deadline_type` got errors: `column deadline_type does not exist`
3. **Rollback applied** (`20251129230000`) to restore `deadline_type` and `source` for old users
4. **Current app code** expects `type` column, which no longer exists after rollback
5. **✅ FIXED** (`20251130000000`) Added `type` column with 3-way sync trigger

### Current Production State (After Fix - 2024-11-30)
| Column | Exists? | Notes |
|--------|---------|-------|
| `source` | ✅ Yes | Synced via trigger |
| `deadline_type` | ✅ Yes | Synced via trigger |
| `type` | ✅ Yes | Synced via trigger |

All 2,777 rows are synced across all three columns.

### Current App Code State
- App code references `type` column (see `src/types/database.types.ts`)
- ✅ App is working for all users (old and new app versions)

---

## Migration Strategy: Backwards-Compatible Transition

We need **both columns to exist and stay synced** so that:
- Old app versions (using `deadline_type`) continue to work
- Current/new app versions (using `type`) work after we apply the fix

---

## Phase 1: Add `type` Column with Sync (IMMEDIATE)

### Step 1.1: Apply Compatibility Migration

This migration adds the `type` column and keeps all three columns (`type`, `deadline_type`, `source`) in sync.

**Migration file**: `supabase/migrations/20251130000000_add_type_column_with_sync.sql`

```sql
-- Add type column and sync with deadline_type/source
-- This allows both old and new app versions to work simultaneously

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
```

### Step 1.2: Apply Migration to Production

```bash
# Using Supabase CLI
supabase db push

# Or direct SQL execution
psql $DATABASE_URL -f supabase/migrations/20251130000000_add_type_column_with_sync.sql
```

### Step 1.3: Verify Migration Success

Run these queries to verify the migration worked:

```sql
-- Verify all three columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deadlines'
  AND column_name IN ('type', 'deadline_type', 'source')
ORDER BY column_name;

-- Expected output:
-- column_name   | data_type | is_nullable
-- deadline_type | text      | YES
-- source        | text      | YES
-- type          | text      | YES

-- Verify all data is synced across columns
SELECT COUNT(*) as total_rows,
       COUNT(*) FILTER (WHERE type = deadline_type OR (type IS NULL AND deadline_type IS NULL)) as synced_rows,
       COUNT(*) FILTER (WHERE type IS DISTINCT FROM deadline_type) as unsynced_rows
FROM deadlines;

-- Expected: unsynced_rows = 0

-- Verify sync trigger exists
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'deadlines'
  AND trigger_name = 'sync_deadline_type_columns_trigger';

-- Expected: 1 row with INSERT and UPDATE events

-- Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'deadlines'
  AND indexname IN ('deadlines_type_idx', 'deadlines_deadline_type_idx');

-- Expected: both indexes listed

-- Test sync trigger with INSERT
INSERT INTO deadlines (user_id, book_title, deadline_date, flexibility, format, total_quantity, type)
VALUES ('test-user-id', 'Test Book', '2025-12-31', 'fixed', 'physical', 100, 'ARC')
RETURNING type, deadline_type, source;

-- Expected: all three columns should have 'ARC'
-- (Remember to delete this test row or use a transaction)
```

### Step 1.4: Regenerate TypeScript Types

After migration, regenerate types to include all columns:

```bash
npm run genTypes
```

Verify `src/types/database.types.ts` includes both `type` and `deadline_type` in the deadlines table.

---

## Phase 2: Monitor & Wait for Updates

### Duration
Wait 2-4 weeks (or until analytics show 95%+ users on new app version).

### What to Monitor
- Error rates for `deadline_type does not exist` (should be zero)
- Error rates for `type does not exist` (should be zero)
- App version adoption in analytics

---

## Phase 3: Cleanup Legacy Columns (After Transition)

Only run this **after** confirming all users are on app versions using `type`.

**Migration file**: `supabase/migrations/202512XX000000_cleanup_legacy_deadline_type_columns.sql`

```sql
-- Phase 3: Cleanup migration - Remove legacy columns
-- ONLY RUN AFTER all users have updated to app versions using 'type'

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
END $$;
```

After cleanup, regenerate types:

```bash
npm run genTypes
```

---

## Database Column State Reference

| State | `source` | `deadline_type` | `type` | Sync Trigger |
|-------|----------|-----------------|--------|--------------|
| **Original (before any migration)** | ✅ Exists | ✅ Exists | ❌ No | 2-way (source ↔ deadline_type) |
| **After Phase 2 broke things** | ❌ Dropped | ❌ Renamed | ✅ Exists | ❌ None |
| **Current (after rollback)** | ✅ Exists | ✅ Exists | ❌ No | 2-way (source ↔ deadline_type) |
| **After Phase 1 fix** | ✅ Exists | ✅ Exists | ✅ Exists | 3-way sync |
| **After Phase 3 cleanup** | ❌ Dropped | ❌ Dropped | ✅ Exists | ❌ None (not needed) |

---

## App Version Compatibility Matrix

| App Version | Column Used | After Phase 1? | After Phase 3? |
|-------------|-------------|----------------|----------------|
| Very Old | `source` | ✅ Works | ❌ Breaks |
| Old | `deadline_type` | ✅ Works | ❌ Breaks |
| Current | `type` | ✅ Works | ✅ Works |

---

## Checklist

### Immediate Actions (Today) - COMPLETED 2024-11-30
- [x] Create migration file `20251130000000_add_type_column_with_sync.sql`
- [x] Test migration on staging/development database
- [x] Run verification queries on staging
- [x] Apply migration to production
- [x] Run verification queries on production (2,777 rows synced, 0 unsynced)
- [x] Regenerate TypeScript types (`npm run genTypes`)
- [ ] Verify app works for both old and new versions (manual testing)

### Short-term (Next 2-4 weeks)
- [ ] Monitor error rates
- [ ] Track app version adoption
- [ ] Communicate update availability to users if needed

### Long-term (After transition period)
- [ ] Verify 95%+ users on new app version
- [ ] Apply Phase 3 cleanup migration
- [ ] Regenerate TypeScript types
- [ ] Delete this migration plan document

---

## Troubleshooting

### "column type does not exist" after Phase 1
The migration didn't run or failed. Check:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'deadlines' AND column_name = 'type';
```

### Data not syncing between columns
Check if trigger exists:
```sql
SELECT * FROM information_schema.triggers
WHERE event_object_table = 'deadlines';
```

### Old app version still failing
Verify `deadline_type` column exists:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'deadlines' AND column_name = 'deadline_type';
```
