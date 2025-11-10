import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const buildQuery = (strings, values) => {
  const text = strings.reduce((acc, part, index) => {
    const placeholder = index < values.length ? `$${index + 1}` : '';
    return `${acc}${part}${placeholder}`;
  }, '');

  return { text, values };
};

const createRunner = (client) => async (strings, ...values) => {
  const { text, values: params } = buildQuery(strings, values);
  const result = await client.query(text, params);
  return result.rows;
};

const createSql = () => {
  if (!connectionString) {
    const noConnection = () => {
      throw new Error(
        'No database connection string was provided. Set process.env.DATABASE_URL before calling sql.'
      );
    };
    noConnection.transaction = () => {
      throw new Error(
        'No database connection string was provided. Set process.env.DATABASE_URL before calling sql.transaction.'
      );
    };
    return noConnection;
  }

  const pool = new Pool({ connectionString });

  const sql = async (strings, ...values) => {
    const client = await pool.connect();
    try {
      const runner = createRunner(client);
      return await runner(strings, ...values);
    } finally {
      client.release();
    }
  };

  sql.transaction = async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const runner = createRunner(client);
      const result = await callback(runner);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  return sql;
};

const sql = createSql();

export default sql;

export async function logStockTransaction({
  runner = sql,
  stockId,
  type,
  quantity,
  unitId = null,
  enteredQuantity = null,
  reason = null,
  metadata = {},
}) {
  if (!stockId) throw new Error("stockId is required for stock transaction log");
  if (!type) throw new Error("type is required for stock transaction log");
  const normalizedQuantity = Number(quantity);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
    throw new Error("quantity must be a positive number for stock transaction log");
  }

  const payload = {
    stock_id: stockId,
    type,
    quantity: normalizedQuantity,
    unit_id: unitId,
    entered_quantity: enteredQuantity,
    reason,
    metadata,
  };

  const [record] = await runner`
    INSERT INTO stock_transactions (stock_id, type, quantity, unit_id, entered_quantity, reason, metadata)
    VALUES (${payload.stock_id}, ${payload.type}, ${payload.quantity}, ${payload.unit_id}, ${payload.entered_quantity}, ${payload.reason}, ${payload.metadata}::jsonb)
    RETURNING *
  `;

  return record;
}