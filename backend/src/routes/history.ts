/**
 * History Routes
 * API endpoints for history management
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getHistory, 
  getActivityHistory, 
  getPredictionHistory, 
  clearHistory,
  exportHistory 
} from '../controllers/historyController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/history
 * Get user history with filters
 */
router.get('/', getHistory);

/**
 * GET /api/history/activity
 * Get activity history
 */
router.get('/activity', getActivityHistory);

/**
 * GET /api/history/predictions
 * Get prediction history
 */
router.get('/predictions', getPredictionHistory);

/**
 * DELETE /api/history
 * Clear history records
 */
router.delete('/', clearHistory);

/**
 * POST /api/history/export
 * Export history data
 */
router.post('/export', exportHistory);

export default router;

