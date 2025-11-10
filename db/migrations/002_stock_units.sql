CREATE TABLE IF NOT EXISTS stock_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  symbol TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_unit_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id INTEGER NOT NULL REFERENCES stock(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES stock_units(id) ON DELETE CASCADE,
  conversion_factor NUMERIC(20, 8) NOT NULL CHECK (conversion_factor > 0),
  is_base BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stock_id, unit_id)
);

ALTER TABLE stock
  ADD COLUMN IF NOT EXISTS base_unit_id UUID REFERENCES stock_units(id);

ALTER TABLE stock_purchases
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES stock_units(id),
  ADD COLUMN IF NOT EXISTS entered_quantity NUMERIC(20, 8);

CREATE TRIGGER set_stock_units_updated_at
BEFORE UPDATE ON stock_units
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_stock_unit_conversions_updated_at
BEFORE UPDATE ON stock_unit_conversions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Migrate existing stock.unit values into stock_units/base unit references
INSERT INTO stock_units (name)
SELECT DISTINCT unit
FROM stock
WHERE unit IS NOT NULL AND unit <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE stock s
SET base_unit_id = su.id
FROM stock_units su
WHERE s.base_unit_id IS NULL AND s.unit = su.name;

INSERT INTO stock_unit_conversions (stock_id, unit_id, conversion_factor, is_base)
SELECT s.id, s.base_unit_id, 1, TRUE
FROM stock s
LEFT JOIN stock_unit_conversions suc ON suc.stock_id = s.id AND suc.is_base = TRUE
WHERE s.base_unit_id IS NOT NULL AND suc.id IS NULL;
