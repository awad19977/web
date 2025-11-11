CREATE TABLE IF NOT EXISTS production_orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_to_produce NUMERIC(20, 8) NOT NULL CHECK (quantity_to_produce > 0),
  quantity_produced NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (quantity_produced >= 0),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  production_cost NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (production_cost >= 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS production_orders_product_idx
  ON production_orders (product_id);

CREATE INDEX IF NOT EXISTS production_orders_status_idx
  ON production_orders (status);

CREATE TRIGGER set_production_orders_updated_at
BEFORE UPDATE ON production_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
