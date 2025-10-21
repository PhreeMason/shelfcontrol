-- Add unique constraints to book identifiers
-- api_id should be unique for Goodreads books (where it's not null)
-- google_volume_id should be unique for Google Books (where it's not null)

-- Create unique partial index for api_id (excludes null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_api_id_unique
ON public.books(api_id)
WHERE api_id IS NOT NULL;

-- Create unique partial index for google_volume_id (excludes null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_google_volume_id_unique
ON public.books(google_volume_id)
WHERE google_volume_id IS NOT NULL;

-- Add comments to document the constraints
COMMENT ON INDEX idx_books_api_id_unique IS 'Ensures api_id uniqueness for Goodreads books';
COMMENT ON INDEX idx_books_google_volume_id_unique IS 'Ensures google_volume_id uniqueness for Google Books';
