export const notFound = (_request, response) => response.status(404).json({ error: 'Route not found' });
export const errorHandler = (error, _request, response, _next) => {
  console.error(error);
  if ([547, 2601, 2627].includes(error.number)) return response.status(409).json({ error: 'Database constraint violation' });
  response.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
};
