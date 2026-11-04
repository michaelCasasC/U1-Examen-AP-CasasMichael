import { randomUUID } from 'node:crypto';
import { getPool } from '../db/pool.js';

const contentColumns = [
  'source_id', 'content_type', 'title', 'date_added', 'release_year',
  'rating', 'duration_value', 'duration_unit', 'duration_text', 'description'
];

const values = (data) => [
  data.source_id || `custom-${randomUUID().slice(0, 13)}`,
  data.content_type,
  data.title,
  data.date_added || null,
  data.release_year || null,
  data.rating || null,
  data.duration_value || null,
  data.duration_unit || null,
  data.duration_text || null,
  data.description || null
];

export const contentRepository = {
  async list(page, limit, search = '') {
    const offset = (page - 1) * limit;
    const pattern = `%${search}%`;
    const pool = getPool();
    const data = await pool.query(
      `SELECT * FROM content
       WHERE $1 = '%%' OR title ILIKE $1 OR content_type ILIKE $1
       ORDER BY id LIMIT $2 OFFSET $3`,
      [pattern, limit, offset]
    );
    const total = await pool.query(
      `SELECT COUNT(*)::int AS total FROM content
       WHERE $1 = '%%' OR title ILIKE $1 OR content_type ILIKE $1`,
      [pattern]
    );
    return { data: data.rows, total: total.rows[0].total };
  },

  async get(id) {
    const result = await getPool().query('SELECT * FROM content WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const columns = contentColumns.join(', ');
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [918273]);
      const placeholders = contentColumns.map((_, index) => `$${index + 1}`).join(', ');
      const result = await client.query(
        `INSERT INTO content (id, ${columns})
         SELECT COALESCE(MAX(id), 0) + 1, ${placeholders}
         FROM content
         RETURNING *`,
        values(data)
      );
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id, data) {
    const assignments = contentColumns.map((column, index) => `${column} = $${index + 1}`).join(', ');
    const result = await getPool().query(
      `UPDATE content SET ${assignments} WHERE id = $${contentColumns.length + 1} RETURNING *`,
      [...values(data), id]
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await getPool().query('DELETE FROM content WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async allForStatistics() {
    const result = await getPool().query('SELECT content_type, release_year FROM content');
    return result.rows;
  }
};
