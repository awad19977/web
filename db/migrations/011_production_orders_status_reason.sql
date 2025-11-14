-- Add a status_reason column and include 'failed' in allowed statuses for production_orders
ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS status_reason TEXT;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'production_orders' AND c.contype = 'c'
  LOOP
    IF r.def ILIKE '%status IN (%' THEN
      EXECUTE format('ALTER TABLE production_orders DROP CONSTRAINT %I', r.conname);
    END IF;
  END LOOP;

  ALTER TABLE production_orders
    ADD CONSTRAINT production_orders_status_check CHECK (status IN ('planned','in_progress','completed','cancelled','failed'));
END$$;
