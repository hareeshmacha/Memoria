import { Router } from 'express';
import { getNotifications, markAsRead } from './notifications.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getNotifications);
router.post('/:id/read', authenticate, markAsRead);

export const notificationsRouter = router;
