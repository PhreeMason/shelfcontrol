
ALTER TABLE deadlines ADD COLUMN deadline_type text;

ALTER TABLE deadlines ADD COLUMN acquisition_source text;

ALTER TABLE deadlines ADD COLUMN publishers text[];

UPDATE deadlines
SET deadline_type = COALESCE(source, 'unknown')
WHERE deadline_type IS NULL;

ALTER TABLE deadlines ALTER COLUMN deadline_type SET NOT NULL;

CREATE OR REPLACE FUNCTION sync_source_to_deadline_type()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deadline_type := NEW.source;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_deadline_type_to_source()
RETURNS TRIGGER AS $$
BEGIN
  NEW.source := NEW.deadline_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_source_to_deadline_type_trigger
  BEFORE INSERT OR UPDATE OF source ON deadlines
  FOR EACH ROW
  EXECUTE FUNCTION sync_source_to_deadline_type();

CREATE TRIGGER sync_deadline_type_to_source_trigger
  BEFORE INSERT OR UPDATE OF deadline_type ON deadlines
  FOR EACH ROW
  EXECUTE FUNCTION sync_deadline_type_to_source();

CREATE INDEX deadlines_deadline_type_idx ON deadlines (deadline_type);
