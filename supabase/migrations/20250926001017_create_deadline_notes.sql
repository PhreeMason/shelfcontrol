-- Create deadline_notes table
create table deadline_notes (
  id text not null primary key default generate_prefixed_id('dn_'),
  deadline_id text references deadlines(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  note_text text not null,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table deadline_notes enable row level security;

-- Users can only see notes for their own deadlines
create policy "Users can view own deadline notes." on deadline_notes
  for select using ((select auth.uid()) = user_id);

-- Users can insert notes for their own deadlines
create policy "Users can insert own deadline notes." on deadline_notes
  for insert with check ((select auth.uid()) = user_id);

-- Users can update their own deadline notes
create policy "Users can update own deadline notes." on deadline_notes
  for update using ((select auth.uid()) = user_id);

-- Users can delete their own deadline notes
create policy "Users can delete own deadline notes." on deadline_notes
  for delete using ((select auth.uid()) = user_id);

-- Create trigger for handle_times on deadline_notes table
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON deadline_notes
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

-- Create indexes for better performance
create index deadline_notes_deadline_id_idx on deadline_notes (deadline_id);
create index deadline_notes_user_id_idx on deadline_notes (user_id);
create index deadline_notes_created_at_idx on deadline_notes (created_at);