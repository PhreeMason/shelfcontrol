CREATE TABLE disclosure_templates (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  template_name text,
  disclosure_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_disclosure_templates_user_source ON disclosure_templates(user_id, source_name);

ALTER TABLE deadlines
  ADD COLUMN disclosure_text text,
  ADD COLUMN disclosure_source_name text,
  ADD COLUMN disclosure_template_id text REFERENCES disclosure_templates(id);

ALTER TABLE disclosure_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disclosure templates" ON disclosure_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disclosure templates" ON disclosure_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own disclosure templates" ON disclosure_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own disclosure templates" ON disclosure_templates
  FOR DELETE USING (auth.uid() = user_id);
