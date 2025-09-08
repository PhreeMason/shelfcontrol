-- Create books table
create table books (
  id uuid not null primary key default gen_random_uuid(),
  title text not null,
  api_id text,
  api_source text,
  cover_image_url text,
  description text,
  edition jsonb,
  format book_format_enum,
  genres text[],
  isbn10 text,
  isbn13 text,
  language text,
  metadata jsonb,
  publication_date text,
  publisher text,
  rating numeric,
  total_duration integer,
  total_pages integer,
  date_added timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table books enable row level security;

-- Allow everyone to read books
create policy "Books are viewable by everyone." on books
  for select using (true);

-- Allow authenticated users to insert books
create policy "Authenticated users can insert books." on books
  for insert with check (auth.uid() is not null);

-- Allow authenticated users to update books
create policy "Authenticated users can update books." on books
  for update using (auth.uid() is not null);

-- Create trigger for handle_times on books table
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON books
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

-- Create indexes for better performance
create index books_title_idx on books using gin (to_tsvector('english', title));
create index books_api_id_idx on books (api_id);
create index books_isbn10_idx on books (isbn10);
create index books_isbn13_idx on books (isbn13);
create index books_genres_idx on books using gin (genres);