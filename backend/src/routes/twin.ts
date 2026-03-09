/**
 * Twin Actions Routes
 * API endpoints for digital twin actions and automations
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  resetLearning,
  triggerAutomation,
  getTwinStatus,
  updateBehaviorProfile
} from '../controllers/twinActionsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/twin/status
 * Get digital twin status
 */
router.get('/status', getTwinStatus);

/**
 * POST /api/twin/reset-learning
 * Reset digital twin learning
 */
router.post('/reset-learning', resetLearning);

/**
 * POST /api/twin/automation
 * Trigger automation action
 */
router.post('/automation', triggerAutomation);

/**
 * PUT /api/twin/behavior-profile
 * Update behavior profile
 */
router.put('/behavior-profile', updateBehaviorProfile);

export default router;

