-- Create deadline_status table
create table deadline_status (
  id serial primary key,
  deadline_id uuid references deadlines(id) on delete cascade,
  status deadline_status_enum,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table deadline_status enable row level security;

-- Users can only see status for their own deadlines
create policy "Users can view own deadline status." on deadline_status
  for select using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = (select auth.uid())
    )
  );

-- Users can insert status for their own deadlines
create policy "Users can insert own deadline status." on deadline_status
  for insert with check (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = (select auth.uid())
    )
  );

-- Users can update status for their own deadlines
create policy "Users can update own deadline status." on deadline_status
  for update using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = (select auth.uid())
    )
  );

-- Users can delete status for their own deadlines
create policy "Users can delete own deadline status." on deadline_status
  for delete using (
    exists (
      select 1 from deadlines d 
      where d.id = deadline_status.deadline_id 
      and d.user_id = (select auth.uid())
    )
  );

-- Create trigger for handle_times on deadline_status table
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON deadline_status
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

-- Create indexes for better performance
create index deadline_status_deadline_id_idx on deadline_status (deadline_id);
create index deadline_status_created_at_idx on deadline_status (created_at);