-- Create deadlines table
create table deadlines (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  book_id uuid references books(id) on delete set null,
  book_title text not null,
  author text,
  source text not null,
  deadline_date timestamp with time zone not null,
  flexibility deadline_flexibility not null,
  format book_format_enum not null default 'physical',
  total_quantity integer not null,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table deadlines enable row level security;

-- Users can only see their own deadlines
create policy "Users can view own deadlines." on deadlines
  for select using ((select auth.uid()) = user_id);

-- Users can insert their own deadlines
create policy "Users can insert own deadlines." on deadlines
  for insert with check ((select auth.uid()) = user_id);

-- Users can update their own deadlines
create policy "Users can update own deadlines." on deadlines
  for update using ((select auth.uid()) = user_id);

-- Users can delete their own deadlines
create policy "Users can delete own deadlines." on deadlines
  for delete using ((select auth.uid()) = user_id);

-- Create trigger for handle_times on deadlines table
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON deadlines
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

-- Create indexes for better performance
create index deadlines_user_id_idx on deadlines (user_id);
create index deadlines_book_id_idx on deadlines (book_id);
create index deadlines_deadline_date_idx on deadlines (deadline_date);