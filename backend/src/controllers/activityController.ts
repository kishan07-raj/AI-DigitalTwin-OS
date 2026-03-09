import { Response } from 'express';
import { Activity, Session, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import mongoose from 'mongoose';

export const trackActivity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, action, element, page, duration, metadata, sessionId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Create activity record
    const activity = new Activity({
      userId,
      type,
      action,
      element,
      page,
      duration,
      metadata,
      sessionId,
      timestamp: new Date(),
    });

    await activity.save();

    // Update session
    if (sessionId) {
      await Session.findOneAndUpdate(
        { sessionId },
        {
          lastActive: new Date(),
          $inc: { events: 1 },
        }
      );
    }

    // Update user's digital twin last active
    await User.findByIdAndUpdate(userId, {
      'digitalTwin.lastActive': new Date(),
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Track activity error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRACK_FAILED',
        message: 'Failed to track activity',
      },
    });
  }
};

export const getActivities = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, page, limit = 50, skip = 0 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const query: any = { userId };
    if (type) query.type = type;
    if (page) query.page = page;

    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Activity.countDocuments(query);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          total,
          limit: Number(limit),
          skip: Number(skip),
        },
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FAILED',
        message: 'Failed to get activities',
      },
    });
  }
};

export const createSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId, device, location } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Check if session already exists
    const existingSession = await Session.findOne({ sessionId });
    if (existingSession) {
      res.json({
        success: true,
        data: existingSession,
      });
      return;
    }

    const session = new Session({
      userId,
      sessionId,
      device,
      location,
      startedAt: new Date(),
      lastActive: new Date(),
      status: 'active',
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_FAILED',
        message: 'Failed to create session',
      },
    });
  }
};

export const endSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findOneAndUpdate(
      { sessionId, status: 'active' },
      {
        status: 'ended',
        endedAt: new Date(),
        $expr: {
          $set: {
            duration: {
              $subtract: [
                new Date(),
                '$startedAt'
              ]
            }
          }
        }
      },
      { new: true }
    );

    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_FAILED',
        message: 'Failed to end session',
      },
    });
  }
};

export const getSessions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const sessions = await Session.find({ userId })
      .sort({ startedAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Session.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total,
          limit: Number(limit),
          skip: Number(skip),
        },
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FAILED',
        message: 'Failed to get sessions',
      },
    });
  }
};

