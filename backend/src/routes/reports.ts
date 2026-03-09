/**
 * Reports Routes
 * API endpoints for AI-powered report generation
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Activity, Session } from '../models';
import { reportController } from '../controllers/reportController';
import NodeCache from 'node-cache';

const router = Router();

// Cache for storing generated reports
const reportCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * GET /api/reports/daily
 * Generate and return daily report
 */
router.get('/daily', authenticate, async (req: Request, res: Response) => {
  try {
    await reportController.generateDailyReport(req, res);
  } catch (error) {
    console.error('Error in daily report route:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DAILY_REPORT_FAILED', message: 'Failed to generate daily report' }
    });
  }
});

/**
 * GET /api/reports/weekly
 * Generate and return weekly report
 */
router.get('/weekly', authenticate, async (req: Request, res: Response) => {
  try {
    await reportController.generateWeeklyReport(req, res);
  } catch (error) {
    console.error('Error in weekly report route:', error);
    res.status(500).json({
      success: false,
      error: { code: 'WEEKLY_REPORT_FAILED', message: 'Failed to generate weekly report' }
    });
  }
});

/**
 * GET /api/reports/monthly
 * Generate and return monthly report
 */
router.get('/monthly', authenticate, async (req: Request, res: Response) => {
  try {
    await reportController.generateMonthlyReport(req, res);
  } catch (error) {
    console.error('Error in monthly report route:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MONTHLY_REPORT_FAILED', message: 'Failed to generate monthly report' }
    });
  }
});

/**
 * POST /api/reports/generate
 * Generate a new report with custom parameters
 */
router.post('/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, startDate, endDate } = req.body;
    
    // Calculate date range based on report type
    let start: Date, end: Date;
    const now = new Date();
    
    switch (type) {
      case 'daily':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date();
        break;
      case 'weekly':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = new Date();
        break;
      case 'monthly':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = new Date();
        break;
      default:
        start = startDate ? new Date(startDate) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
        end = endDate ? new Date(endDate) : new Date();
    }
    
    // Fetch activities and sessions for the period
    const [activities, sessions] = await Promise.all([
      Activity.find({ userId, createdAt: { $gte: start, $lte: end } }),
      Session.find({ userId, startTime: { $gte: start, $lte: end } }),
    ]);
    
    // Calculate statistics
    const totalSessions = sessions.length;
    const totalActivities = activities.length;
    const avgSessionDuration = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
      : 0;
    
    // Calculate productivity score (simplified)
    const productivityScore = Math.min(100, Math.round((totalActivities / Math.max(1, totalSessions)) * 10 + 50));
    
    // Get top features
    const featureCounts: Record<string, number> = {};
    activities.forEach((a: any) => {
      if (a.page) {
        featureCounts[a.page] = (featureCounts[a.page] || 0) + 1;
      }
    });
    const topFeatures = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
    
    // Generate mock insights based on data
    const insights = [
      `You had ${totalSessions} sessions with an average duration of ${Math.round(avgSessionDuration)} minutes.`,
      totalActivities > 100 ? 'Your activity level is above average.' : 'Consider increasing your daily activities.',
      productivityScore > 80 ? 'Great productivity this period!' : 'Room for improvement in productivity.',
    ];
    
    const report = {
      id: `report_${Date.now()}`,
      userId,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`,
      summary: `Your digital twin analyzed ${totalSessions} sessions and generated ${insights.length} insights.`,
      data: {
        totalSessions,
        totalActivities,
        avgSessionDuration: Math.round(avgSessionDuration),
        productivityScore,
        topFeatures,
        insights,
        predictions: [],
        systemAlerts: [],
        behaviorPatterns: [],
        aiInsights: [],
        recommendations: [],
      },
      createdAt: new Date().toISOString(),
      status: 'completed',
    };
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_GENERATION_FAILED', message: 'Failed to generate report' }
    });
  }
});

/**
 * GET /api/reports
 * Get all reports for current user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    // In a full implementation, this would fetch from database
    // For now, return mock data
    const reports = [
      {
        id: '1',
        userId: (req as any).user.id,
        type: 'daily',
        title: 'Daily Report - Today',
        summary: 'Your digital twin analyzed 12 sessions and generated 5 insights.',
        data: {
          totalSessions: 12,
          totalActivities: 156,
          avgSessionDuration: 28,
          productivityScore: 85,
          topFeatures: ['Dashboard', 'Analytics', 'Predictions'],
          insights: ['Peak productivity at 10 AM', 'Most used dashboard'],
          predictions: [],
          systemAlerts: [],
          behaviorPatterns: [],
          aiInsights: [],
          recommendations: [],
        },
        createdAt: new Date().toISOString(),
        status: 'completed',
      },
      {
        id: '2',
        userId: (req as any).user.id,
        type: 'weekly',
        title: 'Weekly Report - This Week',
        summary: 'A comprehensive summary of your weekly productivity patterns.',
        data: {
          totalSessions: 68,
          totalActivities: 892,
          avgSessionDuration: 32,
          productivityScore: 82,
          topFeatures: ['Dashboard', 'Analytics', 'Predictions', 'Activity'],
          insights: ['Best day: Wednesday', 'Improved by 12%'],
          predictions: [],
          systemAlerts: [],
          behaviorPatterns: [],
          aiInsights: [],
          recommendations: [],
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
      },
    ];
    
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORTS_FETCH_FAILED', message: 'Failed to fetch reports' }
    });
  }
});

/**
 * GET /api/reports/:id
 * Get a specific report by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    // Check if it's a cached report type
    if (id.includes('daily') || id.includes('weekly') || id.includes('monthly')) {
      // Regenerate the report
      if (id.includes('daily')) {
        return reportController.generateDailyReport(req, res);
      } else if (id.includes('weekly')) {
        return reportController.generateWeeklyReport(req, res);
      } else {
        return reportController.generateMonthlyReport(req, res);
      }
    }
    
    // Mock report for specific ID
    const report = {
      id,
      userId,
      type: 'daily',
      title: 'Daily Report',
      summary: 'Report summary',
      data: {
        totalSessions: 12,
        totalActivities: 156,
        avgSessionDuration: 28,
        productivityScore: 85,
        topFeatures: ['Dashboard', 'Analytics'],
        insights: ['Insight 1', 'Insight 2'],
        predictions: [],
        systemAlerts: [],
        behaviorPatterns: [],
        aiInsights: [],
        recommendations: [],
      },
      createdAt: new Date().toISOString(),
      status: 'completed',
    };
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_FETCH_FAILED', message: 'Failed to fetch report' }
    });
  }
});

/**
 * GET /api/reports/:id/download
 * Download a report as PDF or JSON
 */
router.get('/:id/download', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format } = req.query;
    const userId = (req as any).user.id;
    
    // Get the report data
    let report: any;
    
    if (id.includes('daily')) {
      // Use controller to generate fresh data
      const cacheKey = `report_daily_${userId}`;
      const cached = reportCache.get(cacheKey);
      if (cached) {
        report = cached;
      } else {
        // Generate new report
        const mockReq = { ...req };
        // We'd need to capture the response, but for now return JSON
        report = {
          id: `report_daily_${Date.now()}`,
          userId,
          type: 'daily',
          title: 'Daily Report',
          data: {},
        };
      }
    } else if (id.includes('weekly')) {
      report = {
        id: `report_weekly_${Date.now()}`,
        userId,
        type: 'weekly',
        title: 'Weekly Report',
        data: {},
      };
    } else if (id.includes('monthly')) {
      report = {
        id: `report_monthly_${Date.now()}`,
        userId,
        type: 'monthly',
        title: 'Monthly Report',
        data: {},
      };
    } else {
      report = {
        id,
        userId,
        type: 'daily',
        title: 'Report',
        data: {},
      };
    }
    
    if (format === 'json') {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=report-${id}.json`);
      res.json(report);
    } else {
      // Return PDF (placeholder - in production use a PDF library)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=report-${id}.json`);
      res.json({
        ...report,
        message: 'PDF generation would happen here. JSON format provided instead.',
        downloadedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_FAILED', message: 'Failed to download report' }
    });
  }
});

/**
 * POST /api/reports/:id/refresh
 * Refresh/regenerate a specific report
 */
router.post('/:id/refresh', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    // Invalidate cache for this report type
    if (id.includes('daily')) {
      reportCache.del(`report_daily_${userId}`);
      return reportController.generateDailyReport(req, res);
    } else if (id.includes('weekly')) {
      reportCache.del(`report_weekly_${userId}`);
      return reportController.generateWeeklyReport(req, res);
    } else if (id.includes('monthly')) {
      reportCache.del(`report_monthly_${userId}`);
      return reportController.generateMonthlyReport(req, res);
    }
    
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_REPORT_TYPE', message: 'Invalid report type for refresh' }
    });
  } catch (error) {
    console.error('Error refreshing report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REFRESH_FAILED', message: 'Failed to refresh report' }
    });
  }
});

export default router;

