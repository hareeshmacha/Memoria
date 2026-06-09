import { Worker, Job } from 'bullmq';
import { env } from '../config/index';
import { prisma } from '../config/database';
import { processMediaAI } from '../modules/media/media.controller';

const redisUrl = env.REDIS_URL || 'redis://localhost:6379';

// Media Processing Worker
export const mediaWorker = new Worker(
  'mediaProcessing',
  async (job: Job) => {
    console.log(`[MediaWorker] Processing job ${job.id} of type ${job.name}`);
    if (job.name === 'process_media') {
      console.log(`[MediaWorker] Processing media ${job.data.mediaId}`);
      
      try {
        // Run AI Tagging & Face Detection
        await processMediaAI(job.data.mediaId, job.data.s3Key);
        
        // Update status to completed so it shows up in gallery
        await prisma.media.update({
          where: { id: job.data.mediaId },
          data: { upload_status: 'completed' }
        });
        console.log(`[MediaWorker] Media ${job.data.mediaId} marked as completed`);
      } catch (error) {
        console.error(`[MediaWorker] Failed to process media ${job.data.mediaId}:`, error);
        await prisma.media.update({
          where: { id: job.data.mediaId },
          data: { upload_status: 'failed' }
        });
      }
    } else if (job.name === 'thumbnail_generate') {
      console.log(`[MediaWorker] Generating thumbnails for media ${job.data.mediaId}`);
    } else if (job.name === 'ai_tag') {
      console.log(`[MediaWorker] AI tagging for media ${job.data.mediaId}`);
    }
  },
  { connection: { url: redisUrl } }
);

// Face Scan Worker
export const faceScanWorker = new Worker(
  'faceScan',
  async (job: Job) => {
    console.log(`[FaceScanWorker] Processing job ${job.id} of type ${job.name}`);
    // Stub
  },
  { connection: { url: redisUrl } }
);

// Downloads (Watermarking) Worker
export const downloadsWorker = new Worker(
  'downloads',
  async (job: Job) => {
    console.log(`[DownloadsWorker] Processing job ${job.id} of type ${job.name}`);
    // Stub
  },
  { connection: { url: redisUrl } }
);

// Email Worker
export const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    console.log(`[EmailWorker] Processing job ${job.id} of type ${job.name}`);
    // Stub
  },
  { connection: { url: redisUrl } }
);

// Worker Event Listeners
[mediaWorker, faceScanWorker, downloadsWorker, emailWorker].forEach(worker => {
  worker.on('completed', (job) => {
    console.log(`[${worker.name}] Job ${job?.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${worker.name}] Job ${job?.id} failed:`, err);
  });
});

console.log('[Workers] Initialized background workers');
