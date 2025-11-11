ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE expenses
SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE expenses
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_expenses_updated_at'
  ) THEN
    CREATE TRIGGER set_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
