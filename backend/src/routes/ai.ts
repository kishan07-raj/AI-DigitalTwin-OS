import { Router, Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { authenticate } from '../middleware/auth';

const router = Router();

// ==================== Digital Twin Routes ====================

// Create digital twin profile
router.post('/twin/profile/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await aiService.createDigitalTwinProfile(userId);
    res.json(result);
  } catch (error) {
    console.error('Error creating digital twin profile:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TWIN_CREATE_FAILED', message: 'Failed to create digital twin profile' }
    });
  }
});

// Get digital twin profile
router.get('/twin/profile/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await aiService.getDigitalTwinProfile(userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting digital twin profile:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TWIN_GET_FAILED', message: 'Failed to get digital twin profile' }
    });
  }
});

// Update typing patterns
router.post('/twin/typing/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { keystrokes } = req.body;
    const result = await aiService.updateTypingPatterns(userId, keystrokes);
    res.json(result);
  } catch (error) {
    console.error('Error updating typing patterns:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TYPING_UPDATE_FAILED', message: 'Failed to update typing patterns' }
    });
  }
});

// Get automations
router.get('/twin/automations/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await aiService.getAutomations(userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting automations:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AUTOMATION_GET_FAILED', message: 'Failed to get automations' }
    });
  }
});

// Get behavior summary
router.get('/twin/summary/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await aiService.getBehaviorSummary(userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting behavior summary:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SUMMARY_GET_FAILED', message: 'Failed to get behavior summary' }
    });
  }
});

// ==================== Adaptive UI Routes ====================

// Track activity
router.post('/adaptive/track/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const activityData = req.body;
    const result = await aiService.trackActivity(userId, activityData);
    res.json(result);
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TRACK_FAILED', message: 'Failed to track activity' }
    });
  }
});

// Get layout prediction
router.get('/adaptive/layout/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { device } = req.query;
    const result = await aiService.getLayoutPrediction(userId, device as string);
    res.json({ success: true, layout: result });
  } catch (error) {
    console.error('Error getting layout prediction:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LAYOUT_FAILED', message: 'Failed to get layout prediction' }
    });
  }
});

// Predict next page
router.get('/adaptive/next-page/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await aiService.predictNextPage(userId);
    res.json({ success: true, nextPage: result });
  } catch (error) {
    console.error('Error predicting next page:', error);
    res.status(500).json({
      success: false,
      error: { code: 'NEXT_PAGE_FAILED', message: 'Failed to predict next page' }
    });
  }
});

// Get adaptive analytics
router.get('/adaptive/analytics/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await aiService.getAdaptiveAnalytics(userId);
    res.json({ success: true, analytics: result });
  } catch (error) {
    console.error('Error getting adaptive analytics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_FAILED', message: 'Failed to get adaptive analytics' }
    });
  }
});

// ==================== Self-Healing Routes ====================

// Log event
router.post('/healing/log', async (req: Request, res: Response) => {
  try {
    const result = await aiService.logEvent(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOG_FAILED', message: 'Failed to log event' }
    });
  }
});

// Get system health
router.get('/healing/health', async (req: Request, res: Response) => {
  try {
    const result = await aiService.getSystemHealth();
    res.json({ success: true, health: result });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HEALTH_FAILED', message: 'Failed to get system health' }
    });
  }
});

// Check and heal
router.post('/healing/check', async (req: Request, res: Response) => {
  try {
    const result = await aiService.checkAndHeal();
    res.json({ success: true, results: result });
  } catch (error) {
    console.error('Error checking and healing:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HEAL_FAILED', message: 'Failed to check and heal' }
    });
  }
});

// ==================== AI Insights Routes ====================

// Generate insights
router.get('/insights/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const insights = await aiService.generateInsights(userId);
    res.json({ success: true, insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INSIGHTS_FAILED', message: 'Failed to generate insights' }
    });
  }
});

// Get productivity insights
router.get('/insights/productivity/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const productivity = await aiService.getProductivityInsights(userId);
    res.json({ success: true, productivity });
  } catch (error) {
    console.error('Error getting productivity insights:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PRODUCTIVITY_FAILED', message: 'Failed to get productivity insights' }
    });
  }
});

export default router;

