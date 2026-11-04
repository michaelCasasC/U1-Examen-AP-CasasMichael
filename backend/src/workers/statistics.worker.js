import { parentPort } from 'node:worker_threads';

parentPort.on('message', (records) => {
  const byType = {};
  const byYear = {};
  for (const record of records) {
    byType[record.content_type] = (byType[record.content_type] || 0) + 1;
    if (record.release_year) byYear[record.release_year] = (byYear[record.release_year] || 0) + 1;
  }
  parentPort.postMessage({
    processed: records.length,
    byType,
    byYear: Object.fromEntries(Object.entries(byYear).sort(([a], [b]) => Number(a) - Number(b)))
  });
});
