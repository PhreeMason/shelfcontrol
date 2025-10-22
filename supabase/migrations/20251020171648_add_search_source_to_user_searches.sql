-- Add search_source column to track which API was used for book searches
ALTER TABLE user_searches
ADD COLUMN IF NOT EXISTS search_source text DEFAULT 'goodreads'
CHECK (search_source IN ('goodreads', 'google_books', 'combined', 'unknown'));

-- Add index for search_source to enable efficient analytics
CREATE INDEX IF NOT EXISTS user_searches_search_source_idx ON user_searches(search_source);

-- Add comment for documentation
COMMENT ON COLUMN user_searches.search_source IS 'Tracks which data source(s) were used: goodreads (scraping only), google_books (API only), combined (both sources merged), unknown (legacy or error)';