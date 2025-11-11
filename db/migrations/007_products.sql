CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  current_stock NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS products_name_idx ON products (LOWER(name));

CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS product_recipes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock_id INTEGER NOT NULL REFERENCES stock(id) ON DELETE RESTRICT,
  quantity_needed NUMERIC(20, 8) NOT NULL CHECK (quantity_needed > 0),
  CONSTRAINT product_recipes_unique_stock UNIQUE (product_id, stock_id)
);

CREATE INDEX IF NOT EXISTS product_recipes_product_id_idx
  ON product_recipes (product_id);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount NUMERIC(18, 2) NOT NULL CHECK (total_amount >= 0),
  customer_name TEXT,
  notes TEXT,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_product_id_idx ON sales (product_id);
CREATE INDEX IF NOT EXISTS sales_sale_date_idx ON sales (sale_date DESC);
