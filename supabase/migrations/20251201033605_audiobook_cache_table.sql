-- Create audiobook_cache table for caching Spotify audiobook metadata
-- 30-day cache expiry to reduce API calls

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS audiobook_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  narrator TEXT,
  description TEXT,
  duration_ms BIGINT NOT NULL,
  total_chapters INTEGER,
  publisher TEXT,
  release_date DATE,
  isbn TEXT,
  cover_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_audiobook_cache_expires_at ON audiobook_cache(expires_at);
CREATE INDEX idx_audiobook_cache_title_trgm ON audiobook_cache USING gin (title gin_trgm_ops);
CREATE INDEX idx_audiobook_cache_author_trgm ON audiobook_cache USING gin (author gin_trgm_ops);

ALTER TABLE audiobook_cache ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE audiobook_cache IS 'Caches Spotify audiobook metadata for 30 days';
