import { Response } from 'express';
import { AIPrediction, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Simulated AI prediction functions
// In production, these would call actual ML models

const predictUILayout = async (userId: mongoose.Types.ObjectId) => {
  // Simulated layout prediction based on user history
  const predictions = {
    preferredLayout: 'sidebar',
    collapsedSidebar: false,
    theme: 'adaptive',
    widgetOrder: ['dashboard', 'analytics', 'tasks', 'notifications'],
    shortcutHints: true,
  };
  
  return {
    type: 'ui_layout',
    modelName: 'adaptive-ui-v1',
    prediction: predictions,
    confidence: 0.85,
    features: ['user_history', 'time_of_day', 'device_type'],
  };
};

const predictUserBehavior = async (userId: mongoose.Types.ObjectId) => {
  // Simulated behavior prediction
  const predictions = {
    likelyActions: ['open_dashboard', 'check_notifications', 'view_reports'],
    peakActivityTime: 'morning',
    preferredFeatures: ['analytics', 'reports'],
    sessionDuration: 30,
  };
  
  return {
    type: 'user_behavior',
    modelName: 'behavior-v1',
    prediction: predictions,
    confidence: 0.78,
    features: ['historical_patterns', 'day_of_week', 'recent_activity'],
  };
};

const suggestAutomation = async (userId: mongoose.Types.ObjectId) => {
  // Simulated automation suggestions
  const suggestions = [
    {
      id: 'auto_schedule',
      title: 'Auto-schedule meetings',
      description: 'Based on your calendar patterns, you typically schedule meetings at 10 AM',
      confidence: 0.82,
    },
    {
      id: 'quick_reply',
      title: 'Quick reply templates',
      description: 'Create quick replies for common messages',
      confidence: 0.75,
    },
  ];
  
  return {
    type: 'task_automation',
    modelName: 'automation-v1',
    prediction: { suggestions },
    confidence: 0.79,
    features: ['user_patterns', 'message_frequency'],
  };
};

export const getPredictions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.query;
    const userId = new mongoose.Types.ObjectId(req.userId);

    let prediction;
    switch (type) {
      case 'ui_layout':
        prediction = await predictUILayout(userId);
        break;
      case 'user_behavior':
        prediction = await predictUserBehavior(userId);
        break;
      case 'task_automation':
        prediction = await suggestAutomation(userId);
        break;
      default:
        // Return all predictions
        const [ui, behavior, automation] = await Promise.all([
          predictUILayout(userId),
          predictUserBehavior(userId),
          suggestAutomation(userId),
        ]);
        prediction = { ui, behavior, automation };
    }

    // Save prediction to database
    if (type) {
      const aiPrediction = new AIPrediction({
        userId,
        ...(prediction as any),
        createdAt: new Date(),
      });
      await aiPrediction.save();
    }

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREDICTION_FAILED',
        message: 'Failed to get predictions',
      },
    });
  }
};

export const submitFeedback = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { predictionId, feedback } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);

    if (predictionId) {
      await AIPrediction.findOneAndUpdate(
        { _id: predictionId, userId },
        { feedback, usedAt: new Date(), used: true }
      );
    }

    // Update user behavior profile based on feedback
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'digitalTwin.behaviorProfile.positiveFeedback': feedback === 'positive' ? 1 : 0,
        'digitalTwin.behaviorProfile.negativeFeedback': feedback === 'negative' ? 1 : 0,
      },
    });

    res.json({
      success: true,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FEEDBACK_FAILED',
        message: 'Failed to submit feedback',
      },
    });
  }
};

export const getPredictionHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, limit = 20 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const query: any = { userId };
    if (type) query.type = type;

    const predictions = await AIPrediction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('Get prediction history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FAILED',
        message: 'Failed to get prediction history',
      },
    });
  }
};

