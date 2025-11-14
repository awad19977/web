-- Add damaged fields to sales table
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS damaged_quantity NUMERIC(20,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS damage_reason TEXT;

-- Optionally, you can add an index if you plan to query by damaged items
CREATE INDEX IF NOT EXISTS sales_damaged_quantity_idx ON sales (damaged_quantity);
