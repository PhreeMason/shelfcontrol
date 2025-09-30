-- Create table to track CSV export rate limiting
CREATE TABLE csv_export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exported_at timestamp with time zone NOT NULL DEFAULT NOW(),
  record_count integer,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE csv_export_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own export logs
CREATE POLICY "Users can view own export logs." ON csv_export_logs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own export logs (handled by edge function)
CREATE POLICY "Users can insert own export logs." ON csv_export_logs
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Create index for efficient rate limit checks
CREATE INDEX idx_csv_export_logs_user_exported ON csv_export_logs (user_id, exported_at DESC);

-- Add comment explaining the table
COMMENT ON TABLE csv_export_logs IS
'Tracks CSV export requests for rate limiting (one export per 24 hours per user) and audit purposes';