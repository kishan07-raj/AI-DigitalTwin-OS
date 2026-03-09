import { Router } from 'express';
import {
  trackActivity,
  getActivities,
  createSession,
  endSession,
  getSessions,
} from '../controllers/activityController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { trackActivitySchema, createSessionSchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Activity tracking - with validation
router.post('/track', validate(trackActivitySchema), trackActivity);
router.get('/', getActivities);

// Session management - with validation
router.post('/session', validate(createSessionSchema), createSession);
router.put('/session/end', endSession);
router.get('/sessions', getSessions);

export default router;

