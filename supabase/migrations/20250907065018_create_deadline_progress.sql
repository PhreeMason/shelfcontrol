-- Create deadline_progress table
create table deadline_progress (
  id uuid not null primary key default gen_random_uuid(),
  deadline_id uuid references deadlines(id) on delete cascade not null,
  current_progress numeric not null default 0,
  time_spent_reading integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table deadline_progress enable row level security;

-- Users can only see progress for their own deadlines
create policy "Users can view own deadline progress." on deadline_progress
  for select using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = (select auth.uid())
    )
  );

-- Users can insert progress for their own deadlines
create policy "Users can insert own deadline progress." on deadline_progress
  for insert with check (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = (select auth.uid())
    )
  );

-- Users can update progress for their own deadlines
create policy "Users can update own deadline progress." on deadline_progress
  for update using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = (select auth.uid())
    )
  );

-- Users can delete progress for their own deadlines
create policy "Users can delete own deadline progress." on deadline_progress
  for delete using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_progress.deadline_id 
      and d.user_id = (select auth.uid())
    )
  );

-- Create trigger for handle_times on deadline_progress table
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON deadline_progress
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

-- Create indexes for better performance
create index deadline_progress_deadline_id_idx on deadline_progress (deadline_id);
create index deadline_progress_created_at_idx on deadline_progress (created_at);