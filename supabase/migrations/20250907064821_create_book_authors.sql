-- Create book_authors junction table
create table book_authors (
  book_id uuid references books(id) on delete cascade not null,
  author_id uuid references authors(id) on delete cascade not null,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  primary key (book_id, author_id)
);

-- Set up Row Level Security (RLS)
alter table book_authors enable row level security;

-- Allow everyone to read book-author relationships
create policy "Book authors are viewable by everyone." on book_authors
  for select using (true);

-- Allow authenticated users to insert book-author relationships
create policy "Authenticated users can insert book authors." on book_authors
  for insert with check (auth.uid() is not null);

-- Allow authenticated users to delete book-author relationships
create policy "Authenticated users can delete book authors." on book_authors
  for delete using (auth.uid() is not null);

-- Create trigger for handle_times on book_authors table
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON book_authors
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

-- Create indexes for better performance
create index book_authors_book_id_idx on book_authors (book_id);
create index book_authors_author_id_idx on book_authors (author_id);