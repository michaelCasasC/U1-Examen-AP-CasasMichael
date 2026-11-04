import { randomUUID } from 'node:crypto';
import { getPool, sql } from '../db/pool.js';

const contentColumns = [
  'source_id', 'content_type', 'title', 'date_added', 'release_year',
  'rating', 'duration_value', 'duration_unit', 'duration_text', 'description'
];

const bindContent = (request, data) => {
  request.input('source_id', sql.NVarChar(20), data.source_id ?? null);
  request.input('content_type', sql.NVarChar(20), data.content_type);
  request.input('title', sql.NVarChar(500), data.title);
  request.input('date_added', sql.Date, data.date_added ?? null);
  request.input('release_year', sql.SmallInt, data.release_year ?? null);
  request.input('rating', sql.NVarChar(30), data.rating ?? null);
  request.input('duration_value', sql.Int, data.duration_value ?? null);
  request.input('duration_unit', sql.NVarChar(20), data.duration_unit ?? null);
  request.input('duration_text', sql.NVarChar(50), data.duration_text ?? null);
  request.input('description', sql.NVarChar(sql.MAX), data.description ?? null);
};

export const contentRepository = {
  async list(page, limit, search = '') {
    const pool = await getPool();
    const offset = (page - 1) * limit;
    const request = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .input('search', sql.NVarChar(500), `%${search}%`);
    const result = await request.query(`
      SELECT * FROM dbo.content
      WHERE @search = '%%' OR title LIKE @search OR content_type LIKE @search
      ORDER BY id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
      SELECT COUNT(*) AS total FROM dbo.content
      WHERE @search = '%%' OR title LIKE @search OR content_type LIKE @search;
    `);
    return { data: result.recordsets[0], total: result.recordsets[1][0].total };
  },

  async get(id) {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, id)
      .query('SELECT * FROM dbo.content WHERE id = @id');
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();
    const request = pool.request();
    bindContent(request, { ...data, source_id: data.source_id || `custom-${randomUUID().slice(0, 13)}` });
    const result = await request.query(`
      DECLARE @id INT = (SELECT ISNULL(MAX(id), 0) + 1 FROM dbo.content);
      INSERT INTO dbo.content (id, ${contentColumns.join(', ')})
      OUTPUT INSERTED.*
      VALUES (@id, @source_id, @content_type, @title, @date_added, @release_year,
        @rating, @duration_value, @duration_unit, @duration_text, @description);
    `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();
    const request = pool.request().input('id', sql.Int, id);
    bindContent(request, data);
    const result = await request.query(`
      UPDATE dbo.content SET source_id=@source_id, content_type=@content_type,
        title=@title, date_added=@date_added, release_year=@release_year,
        rating=@rating, duration_value=@duration_value, duration_unit=@duration_unit,
        duration_text=@duration_text, description=@description
      OUTPUT INSERTED.* WHERE id=@id;
    `);
    return result.recordset[0] || null;
  },

  async remove(id) {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM dbo.content WHERE id = @id');
    return result.rowsAffected[0] > 0;
  },

  async allForStatistics() {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT content_type, release_year FROM dbo.content'
    );
    return result.recordset;
  }
};
