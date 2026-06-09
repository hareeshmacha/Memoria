import { Router } from 'express';
import { registerFace, updateProfile, getProfile, searchUsers, getDashboardStats } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register-face', authenticate, registerFace);
router.put('/me', authenticate, updateProfile);
router.get('/me/dashboard-stats', authenticate, getDashboardStats);
router.get('/profile/:username', getProfile);
router.get('/search', authenticate, searchUsers);

export const usersRouter = router;
