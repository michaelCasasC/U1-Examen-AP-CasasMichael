import express from 'express';
import { contentRepository } from '../repositories/repository.js';
import { contentSchema, validate, validateId } from '../validators/schemas.js';

export const contentRouter = express.Router();

contentRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const search = String(req.query.search || '').trim();
    res.json({ page, limit, search, ...(await contentRepository.list(page, limit, search)) });
  } catch (error) { next(error); }
});

contentRouter.get('/stats', async (req, res, next) => {
  try {
    res.json(await req.app.locals.runStatistics());
  } catch (error) { next(error); }
});

contentRouter.get('/:id', validateId, async (req, res, next) => {
  try {
    const item = await contentRepository.get(req.params.id);
    item ? res.json(item) : res.status(404).json({ error: 'Content not found' });
  } catch (error) { next(error); }
});

contentRouter.post('/', validate(contentSchema), async (req, res, next) => {
  try {
    const item = await contentRepository.create(req.body);
    req.app.locals.io?.emit('content:created', item);
    res.status(201).json(item);
  } catch (error) { next(error); }
});

contentRouter.put('/:id', validateId, validate(contentSchema), async (req, res, next) => {
  try {
    const item = await contentRepository.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Content not found' });
    req.app.locals.io?.emit('content:updated', item);
    res.json(item);
  } catch (error) { next(error); }
});

contentRouter.delete('/:id', validateId, async (req, res, next) => {
  try {
    if (!(await contentRepository.remove(req.params.id))) return res.status(404).json({ error: 'Content not found' });
    req.app.locals.io?.emit('content:deleted', { id: req.params.id });
    res.status(204).send();
  } catch (error) { next(error); }
});
