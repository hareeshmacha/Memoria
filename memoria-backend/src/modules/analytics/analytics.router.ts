import { Router } from 'express';
import { getClubAnalytics, getUserAnalytics } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/clubs/:slug', authenticate, getClubAnalytics);
router.get('/user', authenticate, getUserAnalytics);

export const analyticsRouter = router;
