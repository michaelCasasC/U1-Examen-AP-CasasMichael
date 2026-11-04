import sql from 'mssql';

const config = {
  server: process.env.DB_SERVER || 'sqlserver',
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || 'primevideodb',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 10, min: 1, idleTimeoutMillis: 30000 }
};

let connection;
export const getPool = async () => {
  if (!connection) connection = sql.connect(config).catch((error) => { connection = undefined; throw error; });
  return connection;
};
export const checkDatabase = async () => { const pool = await getPool(); await pool.request().query('SELECT 1'); };
export { sql };
