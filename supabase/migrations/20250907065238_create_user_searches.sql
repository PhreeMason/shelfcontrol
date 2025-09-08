-- Create user_searches table
create table user_searches (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  query text not null,
  result_count integer not null,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table user_searches enable row level security;

-- Users can only see their own search history
create policy "Users can view own search history." on user_searches
  for select using ((select auth.uid()) = user_id);

-- Users can insert their own search history
create policy "Users can insert own search history." on user_searches
  for insert with check ((select auth.uid()) = user_id);

-- Users can update their own search history
create policy "Users can update own search history." on user_searches
  for update using ((select auth.uid()) = user_id);

-- Users can delete their own search history
create policy "Users can delete own search history." on user_searches
  for delete using ((select auth.uid()) = user_id);

-- Create trigger for handle_times on user_searches table
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON user_searches
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

-- Create indexes for better performance
create index user_searches_user_id_idx on user_searches (user_id);
create index user_searches_created_at_idx on user_searches (created_at);
create index user_searches_query_idx on user_searches using gin (to_tsvector('english', query));
