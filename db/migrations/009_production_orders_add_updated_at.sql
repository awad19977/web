ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE production_orders
  ALTER COLUMN updated_at SET DEFAULT NOW();

UPDATE production_orders
  SET updated_at = NOW()
  WHERE updated_at IS NULL;

ALTER TABLE production_orders
  ALTER COLUMN updated_at SET NOT NULL;
