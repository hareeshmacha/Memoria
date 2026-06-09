import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './index';

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

// Test the connection
prisma.$connect()
  .then(() => console.log('Successfully connected to PostgreSQL via Prisma'))
  .catch((e: any) => console.error('Failed to connect to database', e));
