import Joi from 'joi';

export const contentSchema = Joi.object({
  source_id: Joi.string().trim().max(20).allow('', null),
  content_type: Joi.string().valid('MOVIE', 'TV_SHOW', 'OTHER').required(),
  title: Joi.string().trim().min(1).max(500).required(),
  date_added: Joi.date().iso().allow(null, ''),
  release_year: Joi.number().integer().min(1800).max(2200).allow(null),
  rating: Joi.string().max(30).allow('', null),
  duration_value: Joi.number().integer().min(0).allow(null),
  duration_unit: Joi.string().valid('MINUTES', 'SEASONS', 'OTHER').allow(null, ''),
  duration_text: Joi.string().max(50).allow('', null),
  description: Joi.string().max(10000).allow('', null)
});

export const validate = (schema) => (request, response, next) => {
  const { error, value } = schema.validate(request.body, { abortEarly: false, stripUnknown: true });
  if (error) return response.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
  request.body = value;
  next();
};

export const validateId = (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) return response.status(400).json({ error: 'Invalid id' });
  request.params.id = id;
  next();
};
