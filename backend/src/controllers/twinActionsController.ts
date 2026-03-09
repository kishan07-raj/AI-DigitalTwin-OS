/**
 * Twin Actions Controller
 * Handles digital twin actions and automation
 */

import { Response } from 'express';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { Session } from '../models/Session';
import { AIPrediction } from '../models/AIPrediction';
import { AuthenticatedRequest } from '../middleware/auth';

export const resetLearning = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Reset user's digital twin behavior profile
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    // Reset digital twin data
    user.digitalTwin = {
      createdAt: new Date(),
      lastActive: new Date(),
      behaviorProfile: {}
    };
    await user.save();

    // Clear user's predictions
    await AIPrediction.deleteMany({ userId });

    res.json({
      success: true,
      message: 'Digital twin learning has been reset. The system will start learning your patterns fresh.',
      resetAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting learning:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RESET_FAILED', message: 'Failed to reset learning' }
    });
  }
};

export const triggerAutomation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { actionType, parameters } = req.body;

    // Get user data for automation
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    // Process automation based on type
    let result: any = { actionType, executedAt: new Date().toISOString() };

    switch (actionType) {
      case 'generate_insights':
        // Generate new insights based on recent activity
        const recentActivities = await Activity.find({ userId })
          .sort({ timestamp: -1 })
          .limit(100)
          .lean();
        
        result.insights = generateInsightsFromActivities(recentActivities);
        result.success = true;
        break;

      case 'optimize_schedule':
        // Analyze activity patterns and suggest optimal schedule
        const sessions = await Session.find({ userId })
          .sort({ startedAt: -1 })
          .limit(50)
          .lean();
        
        result.schedule = optimizeSchedule(sessions);
        result.success = true;
        break;

      case 'predict_next_actions':
        // Predict user's next likely actions
        const lastActivities = await Activity.find({ userId })
          .sort({ timestamp: -1 })
          .limit(20)
          .lean();
        
        result.predictions = predictNextActions(lastActivities);
        result.success = true;
        break;

      case 'analyze_productivity':
        // Analyze productivity patterns
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekActivities = await Activity.find({ 
          userId, 
          timestamp: { $gte: weekAgo } 
        }).lean();
        
        result.productivity = analyzeProductivity(weekActivities);
        result.success = true;
        break;

      default:
        result.success = false;
        result.error = 'Unknown automation type';
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error triggering automation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AUTOMATION_FAILED', message: 'Failed to trigger automation' }
    });
  }
};

export const getTwinStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    // Get statistics
    const [activityCount, sessionCount, predictionCount] = await Promise.all([
      Activity.countDocuments({ userId }),
      Session.countDocuments({ userId }),
      AIPrediction.countDocuments({ userId })
    ]);

    res.json({
      success: true,
      data: {
        status: 'active',
        digitalTwin: user.digitalTwin,
        statistics: {
          totalActivities: activityCount,
          totalSessions: sessionCount,
          totalPredictions: predictionCount
        },
        createdAt: user.digitalTwin?.createdAt,
        lastActive: user.digitalTwin?.lastActive
      }
    });
  } catch (error) {
    console.error('Error getting twin status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_FAILED', message: 'Failed to get twin status' }
    });
  }
};

export const updateBehaviorProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { behaviorProfile } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    // Update behavior profile
    user.digitalTwin.behaviorProfile = {
      ...user.digitalTwin.behaviorProfile,
      ...behaviorProfile,
      lastUpdated: new Date()
    };
    user.digitalTwin.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Behavior profile updated successfully',
      behaviorProfile: user.digitalTwin.behaviorProfile
    });
  } catch (error) {
    console.error('Error updating behavior profile:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: 'Failed to update behavior profile' }
    });
  }
};

// Helper functions
function generateInsightsFromActivities(activities: any[]): string[] {
  const insights: string[] = [];
  
  if (activities.length === 0) {
    return ['Not enough data to generate insights'];
  }

  // Analyze peak hours
  const hourCounts: Record<number, number> = {};
  activities.forEach(a => {
    if (a.timestamp) {
      const hour = new Date(a.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const peakHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (peakHour) {
    insights.push(`You are most active around ${peakHour[0]}:00`);
  }

  // Analyze most visited pages
  const pageCounts: Record<string, number> = {};
  activities.forEach(a => {
    if (a.page) {
      pageCounts[a.page] = (pageCounts[a.page] || 0) + 1;
    }
  });

  const topPage = Object.entries(pageCounts)
    .sort(([,a], [,b]) => b - a)[0];

  if (topPage) {
    insights.push(`Your most visited page is ${topPage[0]}`);
  }

  return insights;
}

function optimizeSchedule(sessions: any[]): any {
  if (sessions.length === 0) {
    return { suggestion: 'Not enough session data to optimize schedule' };
  }

  // Find most productive hours
  const hourlyProductivity: Record<number, number> = {};
  sessions.forEach(s => {
    if (s.startedAt) {
      const hour = new Date(s.startedAt).getHours();
      hourlyProductivity[hour] = (hourlyProductivity[hour] || 0) + (s.duration || 0);
    }
  });

  const bestHours = Object.entries(hourlyProductivity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  return {
    suggestedSchedule: bestHours.map(h => `${h}:00 - ${h + 1}:00`),
    rationale: 'Based on your historical session data, these are your most productive hours'
  };
}

function predictNextActions(activities: any[]): string[] {
  if (activities.length < 5) {
    return ['Not enough data to predict next actions'];
  }

  // Simple prediction based on common patterns
  const predictions: string[] = [];
  
  // Check for common navigation patterns
  const lastPage = activities[0]?.page;
  if (lastPage === 'dashboard') {
    predictions.push('analytics');
    predictions.push('predictions');
  } else if (lastPage === 'analytics') {
    predictions.push('dashboard');
    predictions.push('reports');
  }

  return predictions;
}

function analyzeProductivity(activities: any[]): any {
  if (activities.length === 0) {
    return { score: 0, message: 'No activities to analyze' };
  }

  // Calculate productivity score based on activity patterns
  const dayCounts: Record<string, number> = {};
  activities.forEach(a => {
    if (a.timestamp) {
      const day = new Date(a.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });

  const totalActivities = activities.length;
  const daysWithActivity = Object.keys(dayCounts).length;
  const avgPerDay = totalActivities / Math.max(daysWithActivity, 1);

  let score = Math.min(100, Math.round(avgPerDay * 10));

  return {
    score,
    totalActivities,
    daysActive: daysWithActivity,
    averagePerDay: Math.round(avgPerDay),
    message: score >= 70 ? 'Great productivity!' : 'Room for improvement'
  };
}

