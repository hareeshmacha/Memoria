import { Router } from 'express';
import { ClubsController } from './clubs.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', ClubsController.getAll);
router.get('/slug/:slug', ClubsController.getBySlug);
router.get('/slug/:slug/events', ClubsController.getEventsBySlug);
router.get('/my', authenticate, ClubsController.getMyClubs);
router.post('/', authenticate, ClubsController.create);

router.put('/:id', authenticate, ClubsController.updateClub);

router.get('/:id/members', authenticate, ClubsController.getMembers);
router.post('/:id/members', authenticate, ClubsController.addMember);
router.delete('/:id/members/:userId', authenticate, ClubsController.removeMember);
router.put('/:id/members/:userId', authenticate, ClubsController.updateMemberRole);

// Join Requests
router.post('/:id/join', authenticate, ClubsController.joinRequest);
router.get('/:id/requests', authenticate, ClubsController.getRequests);
router.post('/:id/requests/:userId/approve', authenticate, ClubsController.approveRequest);
router.post('/:id/requests/:userId/reject', authenticate, ClubsController.rejectRequest);

router.get('/:id/events', authenticate, ClubsController.getEvents);
router.post('/:id/events', authenticate, ClubsController.createEvent);

export default router;
