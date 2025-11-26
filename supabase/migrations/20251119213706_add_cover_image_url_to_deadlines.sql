-- Add cover_image_url column to deadlines table
-- This allows users to provide custom cover images for deadlines
-- Images can be uploaded to Supabase storage or provided as external URLs

-- Add the column (nullable since existing deadlines won't have this)
ALTER TABLE deadlines
ADD COLUMN cover_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN deadlines.cover_image_url IS 'Storage path or external URL for custom deadline cover image. Falls back to book cover if null.';
