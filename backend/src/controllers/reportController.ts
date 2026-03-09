/**
 * Report Controller
 * Handles AI-powered report generation with data aggregation from multiple sources
 */

import { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { Activity, Session, AIPrediction, Notification } from '../models';
import { aiService } from '../services/aiService';
import mongoose from 'mongoose';

// Cache reports for 5 minutes to improve performance
const reportCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Types for report data
interface ReportData {
  // Basic metrics
  totalSessions: number;
  totalActivities: number;
  totalActivityTime: number; // in minutes
  avgSessionDuration: number;
  
  // Page analytics
  mostVisitedPages: Array<{ page: string; count: number; percentage: number }>;
  pageViewsOverTime: Array<{ date: string; views: number }>;
  
  // Productivity
  productivityScore: number;
  productivityTrend: 'up' | 'down' | 'stable';
  peakProductivityHours: number[];
  mostProductiveDay: string;
  
  // AI Insights
  aiInsights: AIInsight[];
  recommendations: string[];
  
  // Predictions
  predictionSummary: {
    total: number;
    accuracy: number;
    topPredictions: Array<{ type: string; confidence: number; prediction: any }>;
  };
  
  // System Alerts
  systemAlerts: SystemAlert[];
  
  // Behavior Patterns
  behaviorPatterns: BehaviorPattern[];
  
  // Time-based data for charts
  activityByHour: Array<{ hour: number; count: number }>;
  activityByDay: Array<{ day: string; count: number }>;
}

interface AIInsight {
  id: string;
  type: 'productivity' | 'usage' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  category: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
}

interface BehaviorPattern {
  type: string;
  description: string;
  frequency: number;
}

// Helper to calculate date range based on report type
function getDateRange(reportType: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  
  let start: Date;
  switch (reportType) {
    case 'daily':
      start = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  return { start, end };
}

// Calculate productivity score based on user behavior
function calculateProductivityScore(sessions: any[], activities: any[]): { score: number; trend: 'up' | 'down' | 'stable' } {
  if (sessions.length === 0) {
    return { score: 50, trend: 'stable' };
  }
  
  // Factors for productivity calculation
  const avgSessionDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;
  const sessionCount = sessions.length;
  const activityCount = activities.length;
  
  // Normalize scores (0-100)
  let score = 50;
  
  // Session duration factor (optimal: 20-60 minutes)
  if (avgSessionDuration >= 20 && avgSessionDuration <= 60) {
    score += 15;
  } else if (avgSessionDuration > 60) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Activity density (activities per session)
  const activityDensity = sessionCount > 0 ? activityCount / sessionCount : 0;
  score += Math.min(15, activityDensity * 2);
  
  // Session consistency bonus
  if (sessionCount >= 5) {
    score += 10;
  } else if (sessionCount >= 3) {
    score += 5;
  }
  
  // Cap at 100
  score = Math.min(100, score);
  
  // Determine trend (simplified - compare first half to second half)
  let trend: 'up' | 'down' | 'stable' = 'stable';
  const midpoint = Math.floor(sessions.length / 2);
  if (midpoint > 0) {
    const firstHalfAvg = sessions.slice(0, midpoint).reduce((sum, s) => sum + (s.duration || 0), 0) / midpoint;
    const secondHalfAvg = sessions.slice(midpoint).reduce((sum, s) => sum + (s.duration || 0), 0) / (sessions.length - midpoint);
    
    if (secondHalfAvg > firstHalfAvg * 1.1) {
      trend = 'up';
    } else if (secondHalfAvg < firstHalfAvg * 0.9) {
      trend = 'down';
    }
  }
  
  return { score: Math.round(score), trend };
}

// Get most visited pages from activities
function getMostVisitedPages(activities: any[], limit: number = 10): Array<{ page: string; count: number; percentage: number }> {
  const pageCounts: Record<string, number> = {};
  
  activities.forEach(activity => {
    if (activity.page) {
      pageCounts[activity.page] = (pageCounts[activity.page] || 0) + 1;
    }
  });
  
  const total = activities.length;
  const sorted = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([page, count]) => ({
      page,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  
  return sorted;
}

// Get activity by hour distribution
function getActivityByHour(activities: any[]): Array<{ hour: number; count: number }> {
  const hourCounts: Record<number, number> = {};
  
  activities.forEach(activity => {
    if (activity.timestamp) {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });
  
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourCounts[i] || 0
  }));
}

// Get activity by day distribution
function getActivityByDay(activities: any[]): Array<{ day: string; count: number }> {
  const dayCounts: Record<string, number> = {
    'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  activities.forEach(activity => {
    if (activity.timestamp) {
      const day = dayNames[new Date(activity.timestamp).getDay()];
      dayCounts[day]++;
    }
  });
  
  return Object.entries(dayCounts).map(([day, count]) => ({ day, count }));
}

// Get peak productivity hours (hours with most activities)
function getPeakProductivityHours(activities: any[]): number[] {
  const hourCounts: Record<number, number> = {};
  
  activities.forEach(activity => {
    if (activity.timestamp) {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });
  
  // Find top 3 hours
  const sorted = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
  
  return sorted.length > 0 ? sorted : [9, 10, 11];
}

// Get most productive day
function getMostProductiveDay(activities: any[]): string {
  const dayCounts: Record<string, number> = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  activities.forEach(activity => {
    if (activity.timestamp) {
      const day = dayNames[new Date(activity.timestamp).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });
  
  const sorted = Object.entries(dayCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : 'Wednesday';
}

// Generate AI-powered insights
async function generateAIInsights(userId: string, data: {
  sessions: any[];
  activities: any[];
  predictions: any[];
  notifications: any[];
}): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  
  try {
    // Try to get AI-generated insights from the AI service
    const aiInsights = await aiService.generateInsights(userId);
    
    if (aiInsights && aiInsights.length > 0) {
      insights.push(...aiInsights.map((insight: any) => ({
        id: insight.id || `ai_${Date.now()}_${Math.random()}`,
        type: insight.type as AIInsight['type'],
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence || 0.8,
        category: insight.category || 'general'
      })));
    }
  } catch (error) {
    console.log('Using fallback insights generation');
  }
  
  // Add data-driven insights if AI insights are empty
  if (insights.length === 0) {
    const { sessions, activities } = data;
    
    // Productivity insight
    const avgDuration = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
      : 0;
    
    if (avgDuration > 0) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'productivity',
        title: 'Session Duration Analysis',
        description: `Your average session duration is ${Math.round(avgDuration)} minutes. ${avgDuration > 30 ? 'Great focus time!' : 'Consider longer sessions for deeper work.'}`,
        confidence: 0.85,
        category: 'time'
      });
    }
    
    // Activity level insight
    const activityRate = sessions.length > 0 ? activities.length / sessions.length : 0;
    insights.push({
      id: `insight_${Date.now()}_2`,
      type: 'usage',
      title: 'Activity Engagement',
      description: `You have an average of ${activityRate.toFixed(1)} activities per session. ${activityRate > 10 ? 'Highly engaged!' : 'Room for more interaction.'}`,
      confidence: 0.80,
      category: 'engagement'
    });
  }
  
  // Add behavioral pattern insights
  const peakHours = getPeakProductivityHours(data.activities);
  if (peakHours.length > 0) {
    insights.push({
      id: `insight_${Date.now()}_3`,
      type: 'pattern',
      title: 'Peak Productivity Hours',
      description: `You are most productive between ${Math.min(...peakHours)}AM and ${Math.max(...peakHours) + 1}AM. Schedule important tasks during these hours.`,
      confidence: 0.90,
      category: 'time'
    });
  }
  
  // Add recommendation insight
  insights.push({
    id: `insight_${Date.now()}_4`,
    type: 'recommendation',
    title: 'Optimization Suggestion',
    description: 'Based on your usage patterns, consider enabling notifications during your least productive hours to minimize distractions during peak times.',
    confidence: 0.75,
    category: 'recommendation'
  });
  
  return insights;
}

// Generate recommendations based on data
function generateRecommendations(data: {
  sessions: any[];
  activities: any[];
  productivityScore: number;
}): string[] {
  const recommendations: string[] = [];
  
  const { sessions, activities, productivityScore } = data;
  
  if (sessions.length < 3) {
    recommendations.push('Try to maintain at least 3 sessions per day for consistent productivity tracking.');
  }
  
  if (productivityScore < 60) {
    recommendations.push('Consider grouping similar tasks together to improve focus and reduce context switching.');
  }
  
  const avgDuration = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
    : 0;
  
  if (avgDuration > 0 && avgDuration < 15) {
    recommendations.push('Your sessions are quite short. Try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break.');
  } else if (avgDuration > 90) {
    recommendations.push('Long sessions detected. Remember to take regular breaks to maintain peak cognitive performance.');
  }
  
  const pageCounts: Record<string, number> = {};
  activities.forEach(a => {
    if (a.page) pageCounts[a.page] = (pageCounts[a.page] || 0) + 1;
  });
  
  const topPage = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0];
  if (topPage) {
    recommendations.push(`You spend most of your time on ${topPage[0]}. Consider creating shortcuts for quick access.`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Your productivity patterns look great! Keep up the consistent work.');
  }
  
  return recommendations;
}

// Get prediction summary
function getPredictionSummary(predictions: any[]): {
  total: number;
  accuracy: number;
  topPredictions: Array<{ type: string; confidence: number; prediction: any }>;
} {
  const total = predictions.length;
  const usedPredictions = predictions.filter(p => p.used);
  const accuracy = total > 0 ? (usedPredictions.length / total) * 100 : 0;
  
  // Group by type
  const typeGroups: Record<string, any[]> = {};
  predictions.forEach(p => {
    if (!typeGroups[p.type]) typeGroups[p.type] = [];
    typeGroups[p.type].push(p);
  });
  
  const topPredictions = Object.entries(typeGroups)
    .slice(0, 5)
    .map(([type, preds]) => ({
      type,
      confidence: preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length,
      prediction: preds[0]?.prediction
    }));
  
  return {
    total,
    accuracy: Math.round(accuracy),
    topPredictions
  };
}

// Get system alerts from notifications
function getSystemAlerts(notifications: any[]): SystemAlert[] {
  return notifications
    .filter(n => n.type === 'alert' || n.type === 'warning')
    .slice(0, 10)
    .map(n => ({
      id: n._id?.toString() || `alert_${Date.now()}`,
      type: (n.type === 'warning' ? 'warning' : 'info') as SystemAlert['type'],
      title: n.title || 'System Notification',
      message: n.message || '',
      timestamp: n.createdAt || new Date()
    }));
}

// Extract behavior patterns
function getBehaviorPatterns(sessions: any[], activities: any[]): BehaviorPattern[] {
  const patterns: BehaviorPattern[] = [];
  
  // Session frequency pattern
  if (sessions.length >= 10) {
    patterns.push({
      type: 'high_frequency',
      description: 'High session frequency - you use the system frequently throughout the day',
      frequency: sessions.length
    });
  }
  
  // Navigation patterns
  const pageSequence: string[] = [];
  activities.forEach(a => {
    if (a.page && a.type === 'navigation') {
      pageSequence.push(a.page);
    }
  });
  
  if (pageSequence.length > 0) {
    patterns.push({
      type: 'navigation_pattern',
      description: `Common navigation path: ${pageSequence.slice(0, 3).join(' → ')}`,
      frequency: pageSequence.length
    });
  }
  
  // Time-based pattern
  const peakHours = getPeakProductivityHours(activities);
  if (peakHours.length > 0) {
    patterns.push({
      type: 'time_preference',
      description: `Primary usage time: ${Math.min(...peakHours)}:00 - ${Math.max(...peakHours) + 1}:00`,
      frequency: activities.length
    });
  }
  
  return patterns;
}

// Main report generation function
async function generateReport(userId: string, reportType: 'daily' | 'weekly' | 'monthly'): Promise<ReportData> {
  const { start, end } = getDateRange(reportType);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Parallel data fetching for performance
  const [activities, sessions, predictions, notifications] = await Promise.all([
    Activity.find({
      userId: userObjectId,
      timestamp: { $gte: start, $lte: end }
    }).lean(),
    
    Session.find({
      userId: userObjectId,
      startedAt: { $gte: start, $lte: end }
    }).lean(),
    
    AIPrediction.find({
      userId: userObjectId,
      createdAt: { $gte: start, $lte: end }
    }).lean(),
    
    Notification.find({
      userId: userObjectId,
      createdAt: { $gte: start, $lte: end }
    }).lean()
  ]);
  
  // Calculate basic metrics
  const totalActivityTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgSessionDuration = sessions.length > 0 ? totalActivityTime / sessions.length : 0;
  
  // Calculate productivity
  const { score: productivityScore, trend: productivityTrend } = calculateProductivityScore(sessions, activities);
  
  // Get analytics data
  const mostVisitedPages = getMostVisitedPages(activities);
  const activityByHour = getActivityByHour(activities);
  const activityByDay = getActivityByDay(activities);
  const peakProductivityHours = getPeakProductivityHours(activities);
  const mostProductiveDay = getMostProductiveDay(activities);
  
  // Get AI insights
  const aiInsights = await generateAIInsights(userId, { sessions, activities, predictions, notifications });
  
  // Generate recommendations
  const recommendations = generateRecommendations({ sessions, activities, productivityScore });
  
  // Get prediction summary
  const predictionSummary = getPredictionSummary(predictions);
  
  // Get system alerts
  const systemAlerts = getSystemAlerts(notifications);
  
  // Get behavior patterns
  const behaviorPatterns = getBehaviorPatterns(sessions, activities);
  
  return {
    totalSessions: sessions.length,
    totalActivities: activities.length,
    totalActivityTime: Math.round(totalActivityTime),
    avgSessionDuration: Math.round(avgSessionDuration),
    mostVisitedPages,
    pageViewsOverTime: activityByDay.map(d => ({ date: d.day, views: d.count })),
    productivityScore,
    productivityTrend,
    peakProductivityHours,
    mostProductiveDay,
    aiInsights,
    recommendations,
    predictionSummary,
    systemAlerts,
    behaviorPatterns,
    activityByHour,
    activityByDay
  };
}

// Controller methods
export const reportController = {
  /**
   * Generate Daily Report
   * GET /api/reports/daily
   */
  generateDailyReport: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const cacheKey = `report_daily_${userId}`;
      
      // Check cache first
      const cached = reportCache.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          report: cached,
          cached: true
        });
      }
      
      const reportData = await generateReport(userId, 'daily');
      
      const report = {
        id: `report_daily_${Date.now()}`,
        userId,
        type: 'daily' as const,
        title: `Daily Report - ${new Date().toLocaleDateString()}`,
        summary: `Analyzed ${reportData.totalSessions} sessions and ${reportData.totalActivities} activities. Productivity score: ${reportData.productivityScore}%`,
        data: reportData,
        createdAt: new Date().toISOString(),
        status: 'completed' as const
      };
      
      // Cache the report
      reportCache.set(cacheKey, report);
      
      res.json({ success: true, report });
    } catch (error) {
      console.error('Error generating daily report:', error);
      res.status(500).json({
        success: false,
        error: { code: 'DAILY_REPORT_FAILED', message: 'Failed to generate daily report' }
      });
    }
  },
  
  /**
   * Generate Weekly Report
   * GET /api/reports/weekly
   */
  generateWeeklyReport: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const cacheKey = `report_weekly_${userId}`;
      
      // Check cache first
      const cached = reportCache.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          report: cached,
          cached: true
        });
      }
      
      const reportData = await generateReport(userId, 'weekly');
      
      const report = {
        id: `report_weekly_${Date.now()}`,
        userId,
        type: 'weekly' as const,
        title: `Weekly Report - Week of ${new Date().toLocaleDateString()}`,
        summary: `Analyzed ${reportData.totalSessions} sessions and ${reportData.totalActivities} activities this week. Productivity score: ${reportData.productivityScore}%`,
        data: reportData,
        createdAt: new Date().toISOString(),
        status: 'completed' as const
      };
      
      // Cache the report
      reportCache.set(cacheKey, report);
      
      res.json({ success: true, report });
    } catch (error) {
      console.error('Error generating weekly report:', error);
      res.status(500).json({
        success: false,
        error: { code: 'WEEKLY_REPORT_FAILED', message: 'Failed to generate weekly report' }
      });
    }
  },
  
  /**
   * Generate Monthly Report
   * GET /api/reports/monthly
   */
  generateMonthlyReport: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const cacheKey = `report_monthly_${userId}`;
      
      // Check cache first
      const cached = reportCache.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          report: cached,
          cached: true
        });
      }
      
      const reportData = await generateReport(userId, 'monthly');
      
      const report = {
        id: `report_monthly_${Date.now()}`,
        userId,
        type: 'monthly' as const,
        title: `Monthly Report - ${new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })}`,
        summary: `Analyzed ${reportData.totalSessions} sessions and ${reportData.totalActivities} activities this month. Productivity score: ${reportData.productivityScore}%`,
        data: reportData,
        createdAt: new Date().toISOString(),
        status: 'completed' as const
      };
      
      // Cache the report
      reportCache.set(cacheKey, report);
      
      res.json({ success: true, report });
    } catch (error) {
      console.error('Error generating monthly report:', error);
      res.status(500).json({
        success: false,
        error: { code: 'MONTHLY_REPORT_FAILED', message: 'Failed to generate monthly report' }
      });
    }
  },
  
  /**
   * Invalidate cache (for testing or manual refresh)
   */
  invalidateCache: (userId: string) => {
    reportCache.del(`report_daily_${userId}`);
    reportCache.del(`report_weekly_${userId}`);
    reportCache.del(`report_monthly_${userId}`);
  }
};

export default reportController;

