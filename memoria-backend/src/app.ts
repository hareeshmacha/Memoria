import express from 'express';
import cors from 'cors';
import { env } from './config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Memoria API is running' });
});

import authRouter from './modules/auth/auth.router';
import clubsRouter from './modules/clubs/clubs.router';
import eventsRouter from './modules/events/events.router';
import { mediaRouter } from './modules/media/media.router';
import { usersRouter } from './modules/users/users.router';
import { notificationsRouter } from './modules/notifications/notifications.router';
import { analyticsRouter } from './modules/analytics/analytics.router';

// Define routes here
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/clubs', clubsRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
