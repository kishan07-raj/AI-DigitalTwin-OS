/**
 * Export Routes
 * API endpoints for data export functionality
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  exportActivityData,
  exportSessionData,
  exportPredictionData,
  exportAllData,
  exportProfile,
  generateDataSummary
} from '../controllers/exportController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/export/activities
 * Export activity data
 */
router.get('/activities', exportActivityData);

/**
 * GET /api/export/sessions
 * Export session data
 */
router.get('/sessions', exportSessionData);

/**
 * GET /api/export/predictions
 * Export prediction data
 */
router.get('/predictions', exportPredictionData);

/**
 * GET /api/export/profile
 * Export user profile
 */
router.get('/profile', exportProfile);

/**
 * GET /api/export/summary
 * Generate data summary
 */
router.get('/summary', generateDataSummary);

/**
 * GET /api/export/all
 * Export all data
 */
router.get('/all', exportAllData);

export default router;

