CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id INTEGER NOT NULL REFERENCES stock(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('increase', 'decrease')),
  quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
  unit_id UUID REFERENCES stock_units(id) ON DELETE SET NULL,
  entered_quantity NUMERIC(20, 8),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_stock_id_created_at
  ON stock_transactions (stock_id, created_at DESC);

-- Backfill historical purchase activity as increases
INSERT INTO stock_transactions (
  stock_id,
  type,
  quantity,
  unit_id,
  entered_quantity,
  reason,
  metadata,
  created_at
)
SELECT
  sp.stock_id,
  'increase',
  sp.quantity,
  sp.unit_id,
  COALESCE(sp.entered_quantity, sp.quantity),
  'purchase',
  jsonb_build_object('purchase_id', sp.id, 'supplier', sp.supplier),
  sp.purchase_date
FROM stock_purchases sp;
