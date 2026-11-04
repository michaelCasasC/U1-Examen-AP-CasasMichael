import express from 'express';
import { checkDatabase } from './db/pool.js';
import { contentRepository } from './repositories/repository.js';
import { contentRouter } from './routes/crud.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
app.locals.io = null;
app.locals.runStatistics = async () => ({});
app.use(express.json());
app.get('/health', async (_req, res) => {
  try { await checkDatabase(); res.json({ status: 'ok', database: 'primevideodb' }); }
  catch (error) { res.status(503).json({ status: 'error', error: error.message }); }
});
app.use('/api/content', contentRouter);
app.use(notFound);
app.use(errorHandler);
app.locals.contentRepository = contentRepository;
export default app;
