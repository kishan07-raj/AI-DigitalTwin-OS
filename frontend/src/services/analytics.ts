/**
 * Analytics Service
 * Handles all analytics and reporting API calls
 */

import api from '../utils/api';

export interface AnalyticsData {
  totalSessions: number;
  totalActivities: number;
  avgSessionDuration: number;
  peakHours: number[];
  mostProductiveDay: string;
  productivityScore: number;
  featureUsage: Record<string, number>;
  timePatterns: {
    peak_hours: number[];
    peak_days: string[];
    avg_session_length: number;
  };
}

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  totalUsers: number;
  totalSessions: number;
  avgProductivity: number;
  topFeatures: string[];
  userComparisons: UserComparison[];
}

export interface UserComparison {
  userId: string;
  userName: string;
  sessions: number;
  productivity: number;
  accuracy: number;
}

class AnalyticsService {
  /**
   * Get analytics data for a user
   */
  async getAnalytics(userId: string): Promise<AnalyticsData> {
    const response = await api.getAdaptiveAnalytics(userId);
    return response.data.analytics;
  }

  /**
   * Get behavior summary
   */
  async getBehaviorSummary(userId: string): Promise<any> {
    const response = await api.getBehaviorSummary(userId);
    return response.data.summary;
  }

  /**
   * Get team analytics
   */
  async getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
    const response = await api.getTeamAnalytics(teamId);
    return response.data.analytics;
  }

  /**
   * Get user comparisons within a team
   */
  async getUserComparisons(teamId: string): Promise<UserComparison[]> {
    const response = await api.getUserComparisons(teamId);
    return response.data.comparisons;
  }

  /**
   * Get feature usage breakdown
   */
  async getFeatureUsage(userId: string): Promise<Record<string, number>> {
    const analytics = await this.getAnalytics(userId);
    return analytics.featureUsage || {};
  }

  /**
   * Get productivity trends over time
   */
  async getProductivityTrends(userId: string, days: number = 7): Promise<any[]> {
    const response = await api.getProductivityTrends(userId, days);
    return response.data.trends;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

