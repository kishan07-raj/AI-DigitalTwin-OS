/**
 * Export Controller
 * Handles all data export-related API endpoints
 */

import { Response } from 'express';
import { Activity } from '../models/Activity';
import { Session } from '../models/Session';
import { AIPrediction } from '../models/AIPrediction';
import { History } from '../models/History';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

export const exportActivityData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { format = 'json', startDate, endDate, type, limit } = req.query;

    const query: any = { userId };
    
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit) || 1000)
      .lean();

    if (format === 'csv') {
      const headers = ['Date', 'Type', 'Page', 'Action', 'Duration', 'Metadata'];
      const rows = (activities as any[]).map((a) => [
        a.timestamp ? new Date(a.timestamp).toISOString() : '',
        a.type || '',
        a.page || '',
        a.action || '',
        a.duration || '',
        JSON.stringify(a.metadata || {})
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=activities-export-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: activities,
        exportedAt: new Date().toISOString(),
        count: activities.length,
        filters: { type, startDate, endDate }
      });
    }
  } catch (error) {
    console.error('Error exporting activity data:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_ACTIVITY_FAILED', message: 'Failed to export activity data' }
    });
  }
};

export const exportSessionData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { format = 'json', startDate, endDate, limit } = req.query;

    const query: any = { userId };
    
    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) query.startedAt.$gte = new Date(startDate as string);
      if (endDate) query.startedAt.$lte = new Date(endDate as string);
    }

    const sessions = await Session.find(query)
      .sort({ startedAt: -1 })
      .limit(Number(limit) || 1000)
      .lean();

    if (format === 'csv') {
      const headers = ['Start Time', 'End Time', 'Duration (min)', 'Page Views', 'Events', 'Status'];
      const rows = (sessions as any[]).map((s) => [
        s.startedAt ? new Date(s.startedAt).toISOString() : '',
        s.endedAt ? new Date(s.endedAt).toISOString() : '',
        s.duration || '',
        s.pageViews || 0,
        s.events || 0,
        s.status || ''
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sessions-export-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: sessions,
        exportedAt: new Date().toISOString(),
        count: sessions.length,
        filters: { startDate, endDate }
      });
    }
  } catch (error) {
    console.error('Error exporting session data:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_SESSION_FAILED', message: 'Failed to export session data' }
    });
  }
};

export const exportPredictionData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { format = 'json', type, limit } = req.query;

    const query: any = { userId };
    if (type) query.type = type;

    const predictions = await AIPrediction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 500)
      .lean();

    if (format === 'csv') {
      const headers = ['Date', 'Type', 'Model', 'Prediction', 'Confidence', 'Feedback', 'Used'];
      const rows = (predictions as any[]).map((p) => [
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
        p.type || '',
        p.modelName || '',
        JSON.stringify(p.prediction || {}),
        p.confidence || '',
        p.feedback || '',
        p.used ? 'Yes' : 'No'
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=predictions-export-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: predictions,
        exportedAt: new Date().toISOString(),
        count: predictions.length,
        filters: { type }
      });
    }
  } catch (error) {
    console.error('Error exporting prediction data:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_PREDICTION_FAILED', message: 'Failed to export prediction data' }
    });
  }
};

export const exportAllData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { format = 'json', dataTypes = 'activities,sessions,predictions,history', startDate, endDate } = req.query;

    const types = (dataTypes as string).split(',');
    const result: any = {
      exportedAt: new Date().toISOString(),
      userId,
      data: {}
    };

    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
    }

    if (types.includes('activities')) {
      const query: any = { userId };
      if (Object.keys(dateFilter).length) query.timestamp = dateFilter;
      
      result.data.activities = await Activity.find(query)
        .sort({ timestamp: -1 })
        .limit(5000)
        .lean();
    }

    if (types.includes('sessions')) {
      const query: any = { userId };
      if (Object.keys(dateFilter).length) query.startedAt = dateFilter;
      
      result.data.sessions = await Session.find(query)
        .sort({ startedAt: -1 })
        .limit(5000)
        .lean();
    }

    if (types.includes('predictions')) {
      result.data.predictions = await AIPrediction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(2000)
        .lean();
    }

    if (types.includes('history')) {
      const query: any = { userId };
      if (Object.keys(dateFilter).length) query.createdAt = dateFilter;
      
      result.data.history = await History.find(query)
        .sort({ createdAt: -1 })
        .limit(2000)
        .lean();
    }

    if (types.includes('profile')) {
      const user = await User.findById(userId).select('-password').lean();
      result.data.profile = user;
    }

    result.counts = {
      activities: result.data.activities?.length || 0,
      sessions: result.data.sessions?.length || 0,
      predictions: result.data.predictions?.length || 0,
      history: result.data.history?.length || 0
    };

    if (format === 'csv') {
      const activities = result.data.activities || [];
      const headers = ['Date', 'Type', 'Page', 'Action', 'Duration'];
      const rows = (activities as any[]).map((a) => [
        a.timestamp ? new Date(a.timestamp).toISOString() : '',
        a.type || '',
        a.page || '',
        a.action || '',
        a.duration || ''
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=full-export-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        ...result
      });
    }
  } catch (error) {
    console.error('Error exporting all data:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_ALL_FAILED', message: 'Failed to export data' }
    });
  }
};

export const exportProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    res.json({
      success: true,
      data: user,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting profile:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_PROFILE_FAILED', message: 'Failed to export profile' }
    });
  }
};

export const generateDataSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
    }

    const activityDateFilter = Object.keys(dateFilter).length ? { timestamp: dateFilter } : {};
    const sessionDateFilter = Object.keys(dateFilter).length ? { startedAt: dateFilter } : {};
    const historyDateFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [activityCount, sessionCount, predictionCount, historyCount] = await Promise.all([
      Activity.countDocuments({ userId, ...activityDateFilter }),
      Session.countDocuments({ userId, ...sessionDateFilter }),
      AIPrediction.countDocuments({ userId }),
      History.countDocuments({ userId, ...historyDateFilter })
    ]);

    const oldestActivity = await Activity.findOne({ userId }).sort({ timestamp: 1 }).lean();
    const newestActivity = await Activity.findOne({ userId }).sort({ timestamp: -1 }).lean();

    res.json({
      success: true,
      data: {
        totalActivities: activityCount,
        totalSessions: sessionCount,
        totalPredictions: predictionCount,
        totalHistoryEvents: historyCount,
        dataRange: {
          oldest: oldestActivity?.timestamp,
          newest: newestActivity?.timestamp
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating data summary:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SUMMARY_FAILED', message: 'Failed to generate data summary' }
    });
  }
};

