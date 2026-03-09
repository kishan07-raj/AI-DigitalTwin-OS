import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get team analytics
router.get('/team/:teamId', authenticate, async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    
    // Mock team analytics data
    const analytics = {
      teamId,
      teamName: 'Engineering',
      totalUsers: 5,
      totalSessions: 685,
      avgProductivity: 83,
      topFeatures: ['Dashboard', 'Analytics', 'Predictions', 'Activity'],
      userComparisons: [
        { userId: 'user1', userName: 'John Doe', sessions: 165, productivity: 88, accuracy: 85 },
        { userId: 'user2', userName: 'Jane Smith', sessions: 156, productivity: 92, accuracy: 88 },
        { userId: 'user3', userName: 'Bob Wilson', sessions: 142, productivity: 85, accuracy: 82 },
        { userId: 'user4', userName: 'Alice Brown', sessions: 128, productivity: 78, accuracy: 79 },
        { userId: 'user5', userName: 'Charlie Davis', sessions: 94, productivity: 72, accuracy: 75 },
      ],
    };
    
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching team analytics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_FETCH_FAILED', message: 'Failed to fetch team analytics' }
    });
  }
});

// Get user comparisons within a team
router.get('/team/:teamId/comparisons', authenticate, async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    
    // Mock comparisons data
    const comparisons = [
      { userId: 'user2', userName: 'Jane Smith', sessions: 156, productivity: 92, accuracy: 88 },
      { userId: 'user3', userName: 'Bob Wilson', sessions: 142, productivity: 85, accuracy: 82 },
      { userId: 'user4', userName: 'Alice Brown', sessions: 128, productivity: 78, accuracy: 79 },
      { userId: 'user5', userName: 'Charlie Davis', sessions: 94, productivity: 72, accuracy: 75 },
      { userId: 'user1', userName: 'John Doe', sessions: 165, productivity: 88, accuracy: 85 },
    ];
    
    res.json({ success: true, comparisons });
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    res.status(500).json({
      success: false,
      error: { code: 'COMPARISONS_FETCH_FAILED', message: 'Failed to fetch comparisons' }
    });
  }
});

// Get productivity trends
router.get('/trends/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;
    
    const daysNum = parseInt(days as string) || 7;
    
    // Generate mock trend data
    const trends = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        productivity: Math.floor(Math.random() * 30) + 70,
        sessions: Math.floor(Math.random() * 20) + 5,
        accuracy: Math.floor(Math.random() * 15) + 75,
      });
    }
    
    res.json({ success: true, trends });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TRENDS_FETCH_FAILED', message: 'Failed to fetch trends' }
    });
  }
});

export default router;

