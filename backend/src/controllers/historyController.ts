/**
 * History Controller
 * Handles all history-related API endpoints
 */

import { Request, Response } from 'express';
import { History } from '../models/History';
import { Activity } from '../models/Activity';
import { Session } from '../models/Session';
import { AIPrediction } from '../models/AIPrediction';
import { AuthenticatedRequest } from '../middleware/auth';

export const getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { type, page = 1, limit = 20, startDate, endDate } = req.query;

    // Build query
    const query: any = { userId };
    
    if (type && type !== 'all') {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [history, total] = await Promise.all([
      History.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      History.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HISTORY_FETCH_FAILED', message: 'Failed to fetch history' }
    });
  }
};

export const getActivityHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;

    const query: any = { userId };
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Activity.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ACTIVITY_HISTORY_FAILED', message: 'Failed to fetch activity history' }
    });
  }
};

export const getPredictionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [predictions, total] = await Promise.all([
      AIPrediction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AIPrediction.countDocuments({ userId })
    ]);

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PREDICTION_HISTORY_FAILED', message: 'Failed to fetch prediction history' }
    });
  }
};

export const clearHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { type, olderThan } = req.body;

    const query: any = { userId };
    
    if (type) {
      query.type = type;
    }
    
    if (olderThan) {
      query.createdAt = { $lt: new Date(olderThan) };
    }

    const result = await History.deleteMany(query);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} history records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CLEAR_HISTORY_FAILED', message: 'Failed to clear history' }
    });
  }
};

export const exportHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { type, format = 'json', startDate, endDate } = req.query;

    const query: any = { userId };
    
    if (type && type !== 'all') {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const history = await History.find(query)
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Date', 'Type', 'Action', 'Description', 'Duration', 'Score', 'Confidence'];
      const rows = history.map(h => [
        new Date(h.createdAt).toISOString(),
        h.type,
        h.action,
        h.description,
        h.metadata?.duration || '',
        h.metadata?.score || '',
        h.metadata?.confidence || ''
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=history-export-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: history,
        exportedAt: new Date().toISOString(),
        count: history.length
      });
    }
  } catch (error) {
    console.error('Error exporting history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_HISTORY_FAILED', message: 'Failed to export history' }
    });
  }
};

export const recordHistory = async (
  userId: string,
  type: 'activity' | 'prediction' | 'report' | 'twin_analysis',
  action: string,
  description: string,
  data: Record<string, any> = {},
  metadata?: { duration?: number; score?: number; confidence?: number }
): Promise<void> => {
  try {
    await History.create({
      userId,
      type,
      action,
      description,
      data,
      metadata
    });
  } catch (error) {
    console.error('Error recording history:', error);
  }
};

