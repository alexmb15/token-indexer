import 'dotenv/config';
import { connectMongo } from './loaders/mongo.js';
import { tokenQueue, fetchTokensJob } from './jobs/fetchTokensJob.js';
import { Worker } from 'bullmq';
import { logger } from './loaders/logger.js';
import { redis } from './loaders/redis.js';
import { CHAINS } from './config/index.js';

(async () => {
  await connectMongo();

  /* ─────────── SCHEDULER ─────────── */
  await Promise.all(
    CHAINS.map(chainId =>
      tokenQueue.add(
       `fetch-${chainId}`,
       { chainId },
       { repeat: { pattern: '*/10 * * * *' } }
      )
    )
  );

  /* ─────────── WORKER ────────────── */
  new Worker(
    'token-fetch',
    job => fetchTokensJob(job.data.chainId),
    { connection: redis, concurrency: 3 }
  );

  logger.info({ chains: CHAINS }, 'Scheduler started');
})();
