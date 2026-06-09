import { Queue } from 'bullmq';
import { env } from './index';

const defaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: false,
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
};

const redisUrl = env.REDIS_URL || 'redis://localhost:6379';

export const mediaQueue = new Queue('mediaProcessing', {
  connection: { url: redisUrl },
  defaultJobOptions,
});

export const faceScanQueue = new Queue('faceScan', {
  connection: { url: redisUrl },
  defaultJobOptions,
});

export const downloadsQueue = new Queue('downloads', {
  connection: { url: redisUrl },
  defaultJobOptions,
});

export const emailQueue = new Queue('email', {
  connection: { url: redisUrl },
  defaultJobOptions,
});
