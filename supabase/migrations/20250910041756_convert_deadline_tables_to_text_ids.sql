-- Migration to convert deadline tables to use text IDs (except deadline_status.id stays uuid)
-- Database is empty, so no data migration needed

-- PART 1: Drop all existing constraints and policies
-- ===================================================

-- Drop all policies
drop policy if exists "Users can view own deadlines." on deadlines;
drop policy if exists "Users can insert own deadlines." on deadlines;
drop policy if exists "Users can update own deadlines." on deadlines;
drop policy if exists "Users can delete own deadlines." on deadlines;

drop policy if exists "Users can view own deadline progress." on deadline_progress;
drop policy if exists "Users can insert own deadline progress." on deadline_progress;
drop policy if exists "Users can update own deadline progress." on deadline_progress;
drop policy if exists "Users can delete own deadline progress." on deadline_progress;

drop policy if exists "Users can view own deadline status." on deadline_status;
drop policy if exists "Users can insert own deadline status." on deadline_status;
drop policy if exists "Users can update own deadline status." on deadline_status;
drop policy if exists "Users can delete own deadline status." on deadline_status;

-- Also drop the new policies if they exist (from previous migration)
drop policy if exists "Users can view own deadline status" on deadline_status;
drop policy if exists "Users can insert own deadline status" on deadline_status;
drop policy if exists "Users can update own deadline status" on deadline_status;
drop policy if exists "Users can delete own deadline status" on deadline_status;

-- Drop foreign key constraints
alter table deadline_progress drop constraint if exists deadline_progress_deadline_id_fkey;
alter table deadline_status drop constraint if exists deadline_status_deadline_id_fkey;

-- PART 2: Modify column types
-- ============================

-- Convert deadlines.id from uuid to text
alter table deadlines alter column id type text;
alter table deadlines alter column id set default gen_random_uuid()::text;

-- Convert deadline_progress.id from uuid to text
alter table deadline_progress alter column id type text;
alter table deadline_progress alter column id set default gen_random_uuid()::text;

-- Convert deadline_progress.deadline_id from uuid to text
alter table deadline_progress alter column deadline_id type text;

-- For deadline_status: keep id as uuid, only convert deadline_id to text
-- Ensure deadline_status.id stays as uuid (it might have been changed by previous migration)
alter table deadline_status alter column id type uuid using id::uuid;
alter table deadline_status alter column id set default gen_random_uuid();

-- Convert deadline_status.deadline_id from uuid to text
alter table deadline_status alter column deadline_id type text;

-- PART 3: Re-establish foreign key relationships
-- ===============================================

alter table deadline_progress 
  add constraint deadline_progress_deadline_id_fkey 
  foreign key (deadline_id) references deadlines(id) on delete cascade;

alter table deadline_status 
  add constraint deadline_status_deadline_id_fkey 
  foreign key (deadline_id) references deadlines(id) on delete cascade;

-- PART 4: Recreate all policies
-- ==============================

-- Policies for deadlines table
create policy "Users can view own deadlines" on deadlines
  for select using (auth.uid() = user_id);

create policy "Users can insert own deadlines" on deadlines
  for insert with check (auth.uid() = user_id);

create policy "Users can update own deadlines" on deadlines
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own deadlines" on deadlines
  for delete using (auth.uid() = user_id);

-- Policies for deadline_progress table
create policy "Users can view own deadline progress" on deadline_progress
  for select using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = auth.uid()
    )
  );

create policy "Users can insert own deadline progress" on deadline_progress
  for insert with check (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = auth.uid()
    )
  );

create policy "Users can update own deadline progress" on deadline_progress
  for update using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = auth.uid()
    )
  );

create policy "Users can delete own deadline progress" on deadline_progress
  for delete using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = auth.uid()
    )
  );

-- Policies for deadline_status table
create policy "Users can view own deadline status" on deadline_status
  for select using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = auth.uid()
    )
  );

create policy "Users can insert own deadline status" on deadline_status
  for insert with check (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = auth.uid()
    )
  );

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

create policy "Users can delete own deadline status" on deadline_status
  for delete using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = auth.uid()
    )
  );

-- PART 5: Create/update indexes
-- ==============================

-- Indexes for deadlines
create index if not exists deadlines_user_id_idx on deadlines (user_id);
create index if not exists deadlines_book_id_idx on deadlines (book_id);
create index if not exists deadlines_deadline_date_idx on deadlines (deadline_date);
create index if not exists deadlines_updated_at_idx on deadlines (updated_at);
create index if not exists deadlines_user_id_deadline_date_idx on deadlines (user_id, deadline_date);
create index if not exists deadlines_format_idx on deadlines (format);
create index if not exists deadlines_flexibility_idx on deadlines (flexibility);

-- Indexes for deadline_progress
create index if not exists deadline_progress_deadline_id_idx on deadline_progress (deadline_id);
create index if not exists deadline_progress_created_at_idx on deadline_progress (created_at);
create index if not exists deadline_progress_updated_at_idx on deadline_progress (updated_at);
create index if not exists deadline_progress_current_progress_idx on deadline_progress (current_progress);

-- Indexes for deadline_status
create index if not exists deadline_status_deadline_id_idx on deadline_status (deadline_id);
create index if not exists deadline_status_created_at_idx on deadline_status (created_at);
create index if not exists deadline_status_status_idx on deadline_status (status);
create index if not exists deadline_status_updated_at_idx on deadline_status (updated_at);

-- PART 6: Add documentation
-- ==========================

comment on column deadlines.id is 'Text-based unique identifier for the deadline record';
comment on column deadline_progress.id is 'Text-based unique identifier for the deadline progress record';
comment on column deadline_progress.deadline_id is 'Foreign key reference to deadlines.id (text)';
comment on column deadline_status.id is 'UUID unique identifier for the deadline status record';
comment on column deadline_status.deadline_id is 'Foreign key reference to deadlines.id (text)';