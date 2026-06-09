import { Queue } from 'bullmq';
import { redisConnection } from './redis';

const defaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: false,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
};

export const mediaQueue = new Queue('mediaProcessing', {
  connection: redisConnection,
  defaultJobOptions,
});

export const faceScanQueue = new Queue('faceScan', {
  connection: redisConnection,
  defaultJobOptions,
});

export const downloadsQueue = new Queue('downloads', {
  connection: redisConnection,
  defaultJobOptions,
});

export const emailQueue = new Queue('email', {
  connection: redisConnection,
  defaultJobOptions,
});
