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