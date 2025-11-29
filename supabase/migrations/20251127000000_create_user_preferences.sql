-- Create user_preferences table with JSONB for flexible preference storage
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Use existing handle_times trigger for created_at/updated_at
CREATE TRIGGER handle_times
  BEFORE INSERT OR UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE PROCEDURE handle_times();

-- Add comment describing the JSONB structure
COMMENT ON TABLE user_preferences IS 'User preferences stored as JSONB. Expected keys: analytics_enabled (bool), crash_reporting_enabled (bool), require_pause_notes (bool), require_dnf_notes (bool)';
