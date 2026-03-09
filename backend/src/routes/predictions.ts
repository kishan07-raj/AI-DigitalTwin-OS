import { Router } from 'express';
import {
  getPredictions,
  submitFeedback,
  getPredictionHistory,
} from '../controllers/predictionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getPredictions);
router.post('/feedback', submitFeedback);
router.get('/history', getPredictionHistory);

export default router;

