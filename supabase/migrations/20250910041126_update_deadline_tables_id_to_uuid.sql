-- Migration to change deadline_status.id from serial to uuid

-- Step 1: Drop existing policies (we'll recreate them)
drop policy if exists "Users can view own deadline status." on deadline_status;
drop policy if exists "Users can insert own deadline status." on deadline_status;
drop policy if exists "Users can update own deadline status." on deadline_status;
drop policy if exists "Users can delete own deadline status." on deadline_status;

-- Step 2: Drop existing indexes
drop index if exists deadline_status_deadline_id_idx;
drop index if exists deadline_status_created_at_idx;

-- Step 3: Create a new temporary column
alter table deadline_status add column new_id uuid default gen_random_uuid();

-- Step 4: Update the new column with unique values for existing rows
update deadline_status set new_id = gen_random_uuid() where new_id is null;

-- Step 5: Drop the old id column (this will also drop the primary key constraint)
alter table deadline_status drop column id;

-- Step 6: Rename the new column to id
alter table deadline_status rename column new_id to id;

-- Step 7: Add primary key constraint to the new id column
alter table deadline_status add primary key (id);

-- Step 8: Make id not null
alter table deadline_status alter column id set not null;

-- Step 9: Recreate policies with improved structure
-- Users can only see status for their own deadlines
create policy "Users can view own deadline status" on deadline_status
  for select using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = auth.uid()
    )
  );

-- Users can insert status for their own deadlines
create policy "Users can insert own deadline status" on deadline_status
  for insert with check (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = auth.uid()
    )
  );

-- Users can update status for their own deadlines
create policy "Users can update own deadline status" on deadline_status
  for update using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = auth.uid()
    )
  );

-- Users can delete status for their own deadlines
create policy "Users can delete own deadline status" on deadline_status
  for delete using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = auth.uid()
    )
  );

-- Step 10: Recreate indexes for better performance
create index deadline_status_deadline_id_idx on deadline_status (deadline_id);
create index deadline_status_created_at_idx on deadline_status (created_at);
create index deadline_status_status_idx on deadline_status (status);

-- Add improved indexes for deadline_progress and deadlines tables
-- These tables already have uuid IDs but let's ensure they have optimal indexes

-- Additional indexes for deadline_progress
create index if not exists deadline_progress_updated_at_idx on deadline_progress (updated_at);
create index if not exists deadline_progress_current_progress_idx on deadline_progress (current_progress);

-- Additional indexes for deadlines
create index if not exists deadlines_updated_at_idx on deadlines (updated_at);
create index if not exists deadlines_user_id_deadline_date_idx on deadlines (user_id, deadline_date);
create index if not exists deadlines_format_idx on deadlines (format);
create index if not exists deadlines_flexibility_idx on deadlines (flexibility);

-- Step 11: Add comments for documentation
comment on column deadline_status.id is 'Unique identifier for the deadline status record';
comment on column deadline_progress.id is 'Unique identifier for the deadline progress record';
comment on column deadlines.id is 'Unique identifier for the deadline record';