import { PrismaClient } from '@prisma/client';
import { env } from './index';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

// Test the connection
prisma.$connect()
  .then(() => console.log('Successfully connected to PostgreSQL via Prisma'))
  .catch((e: any) => console.error('Failed to connect to database', e));
