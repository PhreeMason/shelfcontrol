-- Create function to generate reading notes CSV data
CREATE OR REPLACE FUNCTION get_reading_notes_csv(p_user_id uuid)
RETURNS TABLE (
  book_title text,
  deadline_id text,
  note_text text,
  created_at text,
  updated_at text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.book_title,
    dn.deadline_id,
    dn.note_text,
    TO_CHAR(dn.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as created_at,
    TO_CHAR(dn.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as updated_at
  FROM deadline_notes dn
  INNER JOIN deadlines d ON dn.deadline_id = d.id
  WHERE dn.user_id = p_user_id
  ORDER BY dn.deadline_id, dn.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_reading_notes_csv(uuid) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION get_reading_notes_csv(uuid) IS
'Generates CSV export data for a user''s deadline notes. Each note is a separate row for better readability when there are many notes per deadline.';