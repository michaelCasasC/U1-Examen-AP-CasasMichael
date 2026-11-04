import { createServer } from 'node:http';
import { Worker } from 'node:worker_threads';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config.js';
import { getPool } from './db/pool.js';
import { contentRepository } from './repositories/repository.js';

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true } });
app.locals.io = io;
io.on('connection', (socket) => {
  socket.emit('connected', { database: 'primevideodb' });
});

app.locals.runStatistics = async () => {
  const records = await contentRepository.allForStatistics();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./workers/statistics.worker.js', import.meta.url));
    worker.once('message', (result) => {
      resolve({ ...result, concurrent: true });
      worker.terminate();
    });
    worker.once('error', reject);
    worker.postMessage(records);
  });
};

getPool()
  .then(() => httpServer.listen(env.port, '0.0.0.0', () => console.log(`PrimeVideoDB API listening on ${env.port}`)))
  .catch((error) => { console.error(error); process.exit(1); });
