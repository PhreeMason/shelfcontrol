-- Create spotify_tokens table for storing Spotify API access tokens
-- Uses client credentials flow, single row design

CREATE TABLE IF NOT EXISTS spotify_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- RLS: Only service role can access (edge functions use service role key)
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE spotify_tokens IS 'Stores Spotify API access token for audiobook lookups (single row)';
