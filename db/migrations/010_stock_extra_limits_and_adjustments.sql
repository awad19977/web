ALTER TABLE stock
  ADD COLUMN IF NOT EXISTS allow_extra_production BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS extra_production_limit NUMERIC(20, 8) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS production_order_extras (
  id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  stock_id INTEGER NOT NULL REFERENCES stock(id) ON DELETE RESTRICT,
  quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS production_order_extras_order_stock_idx
  ON production_order_extras (production_order_id, stock_id);

CREATE TRIGGER set_production_order_extras_updated_at
BEFORE UPDATE ON production_order_extras
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES stock(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('increase', 'decrease')),
  quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
  reason TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS stock_adjustments_status_idx
  ON stock_adjustments (status);

CREATE INDEX IF NOT EXISTS stock_adjustments_stock_idx
  ON stock_adjustments (stock_id);

CREATE TRIGGER set_stock_adjustments_updated_at
BEFORE UPDATE ON stock_adjustments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
