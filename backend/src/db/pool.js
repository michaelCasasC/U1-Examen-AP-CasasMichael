import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'primevideodb',
  user: process.env.DB_USER || 'primevideo_admin',
  password: process.env.DB_PASSWORD
});

export const getPool = () => pool;
export const checkDatabase = async () => {
  await pool.query('SELECT 1');
};
