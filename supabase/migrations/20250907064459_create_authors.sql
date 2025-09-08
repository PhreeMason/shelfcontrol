-- Create authors table
create table authors (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table authors enable row level security;

-- Allow everyone to read authors
create policy "Authors are viewable by everyone." on authors
  for select using (true);

-- Allow authenticated users to insert authors
create policy "Authenticated users can insert authors." on authors
  for insert with check (auth.uid() is not null);

-- Allow authenticated users to update authors
create policy "Authenticated users can update authors." on authors
  for update using (auth.uid() is not null);

-- Create trigger for handle_times on authors table
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON authors
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();