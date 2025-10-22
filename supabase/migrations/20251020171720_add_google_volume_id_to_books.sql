-- Add google_volume_id column to books table for Google Books API integration
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS google_volume_id TEXT;

-- Add index for efficient lookups by google_volume_id
CREATE INDEX IF NOT EXISTS idx_books_google_volume_id
ON public.books(google_volume_id)
WHERE google_volume_id IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.books.google_volume_id IS 'Google Books API volume ID for books fetched from Google Books';