import { Router } from 'express';
import { EventsController } from './events.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', EventsController.getAll);
router.post('/', authenticate, EventsController.create);
router.put('/:id', authenticate, EventsController.update);
router.delete('/:id', authenticate, EventsController.delete);

export default router;
