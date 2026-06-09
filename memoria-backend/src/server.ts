import http from 'http';
import app from './app';
import { env } from './config';
import './config/database'; // Initialize Prisma connection
import { initSocket } from './socket';

import { RekognitionService } from './services/rekognition.service';
import './workers/worker'; // Initialize background workers

const server = http.createServer(app);
initSocket(server);

const PORT = env.PORT || 4000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Initialize AWS Rekognition
  await RekognitionService.initializeCollection();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
