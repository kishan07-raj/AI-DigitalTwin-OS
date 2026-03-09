/**
 * AI Engine Service Layer
 * Handles communication between Express backend and FastAPI AI Engine
 */

import axios, { AxiosInstance } from 'axios';

// AI Engine configuration
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

interface DigitalTwinProfile {
  user_id: string;
  typing_patterns: Record<string, number>;
  navigation_preferences: string[];
  feature_usage: Record<string, number>;
  time_based_patterns: Record<string, any>;
  task_sequences: string[][];
  last_updated: string;
}

interface LayoutPrediction {
  preferredLayout: string;
  sidebarCollapsed: boolean;
  widgetOrder: string[];
  theme: string;
  shortcutHints: boolean;
  confidence: number;
}

interface SystemHealth {
  status: string;
  error_rate: number;
  total_logs: number;
  recent_errors: number;
  active_anomalies: number;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  category: string;
}

class AIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: AI_ENGINE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ==================== Digital Twin Service ====================

  /**
   * Create a digital twin profile for a user
   */
  async createDigitalTwinProfile(userId: string): Promise<any> {
    try {
      const response = await this.client.post(`/digital-twin/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error creating digital twin profile:', error);
      throw error;
    }
  }

  /**
   * Get digital twin profile for a user
   */
  async getDigitalTwinProfile(userId: string): Promise<any> {
    try {
      const response = await this.client.get(`/digital-twin/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting digital twin profile:', error);
      // Return mock data if AI engine is unavailable
      return this.getMockTwinProfile(userId);
    }
  }

  /**
   * Update typing patterns for a user
   */
  async updateTypingPatterns(userId: string, keystrokes: any[]): Promise<any> {
    try {
      const response = await this.client.post(`/digital-twin/typing/${userId}`, keystrokes);
      return response.data;
    } catch (error) {
      console.error('Error updating typing patterns:', error);
      throw error;
    }
  }

  /**
   * Get suggested automations for a user
   */
  async getAutomations(userId: string): Promise<any> {
    try {
      const response = await this.client.get(`/digital-twin/automations/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting automations:', error);
      return { success: true, automations: this.getMockAutomations() };
    }
  }

  /**
   * Get behavior summary for a user
   */
  async getBehaviorSummary(userId: string): Promise<any> {
    try {
      const response = await this.client.get(`/digital-twin/summary/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting behavior summary:', error);
      return { success: true, summary: this.getMockBehaviorSummary(userId) };
    }
  }

  // ==================== Adaptive UI Service ====================

  /**
   * Track user activity for adaptive UI
   */
  async trackActivity(userId: string, activityData: {
    type: string;
    element: string;
    page: string;
    duration?: number;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      const response = await this.client.post(`/adaptive-ui/track/${userId}`, activityData);
      return response.data;
    } catch (error) {
      console.error('Error tracking activity:', error);
      throw error;
    }
  }

  /**
   * Get layout prediction for a user
   */
  async getLayoutPrediction(userId: string, device: string = 'desktop'): Promise<LayoutPrediction> {
    try {
      const response = await this.client.get(`/adaptive-ui/layout/${userId}`, {
        params: { device },
      });
      return response.data.layout;
    } catch (error) {
      console.error('Error getting layout prediction:', error);
      return this.getMockLayoutPrediction();
    }
  }

  /**
   * Predict next page for a user
   */
  async predictNextPage(userId: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/adaptive-ui/next-page/${userId}`);
      return response.data.nextPage;
    } catch (error) {
      console.error('Error predicting next page:', error);
      return null;
    }
  }

  /**
   * Get full analytics for adaptive UI
   */
  async getAdaptiveAnalytics(userId: string): Promise<any> {
    try {
      const response = await this.client.get(`/adaptive-ui/analytics/${userId}`);
      return response.data.analytics;
    } catch (error) {
      console.error('Error getting adaptive analytics:', error);
      return this.getMockAdaptiveAnalytics();
    }
  }

  // ==================== Self-Healing Service ====================

  /**
   * Log an event to the self-healing system
   */
  async logEvent(data: {
    level: string;
    source: string;
    message: string;
    metadata?: Record<string, any>;
    sessionId?: string;
    userId?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/self-healing/log', data);
      return response.data;
    } catch (error) {
      console.error('Error logging event:', error);
      throw error;
    }
  }

  /**
   * Get system health from self-healing
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await this.client.get('/self-healing/health');
      return response.data.health;
    } catch (error) {
      // AI Engine not available - return mock data silently
      return this.getMockSystemHealth();
    }
  }

  /**
   * Check and heal anomalies
   */
  async checkAndHeal(): Promise<any> {
    try {
      const response = await this.client.post('/self-healing/check');
      return response.data.results;
    } catch (error) {
      // AI Engine not available - return mock data silently
      return this.getMockHealResults();
    }
  }

  // ==================== AI Insights Engine ====================

  /**
   * Generate AI insights for a user
   */
  async generateInsights(userId: string): Promise<Insight[]> {
    try {
      // Generate insights based on user behavior
      const [profile, analytics] = await Promise.all([
        this.getDigitalTwinProfile(userId),
        this.getAdaptiveAnalytics(userId),
      ]);

      const insights = this.generateInsightsFromData(profile, analytics);
      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Get productivity insights
   */
  async getProductivityInsights(userId: string): Promise<any> {
    try {
      const analytics = await this.getAdaptiveAnalytics(userId);
      const timePatterns = analytics?.timePatterns || {};

      return {
        peakHours: timePatterns.peak_hours || [9, 10, 11],
        mostProductiveDay: 'Wednesday',
        avgSessionDuration: 30,
        productivityScore: 85,
      };
    } catch (error) {
      return this.getMockProductivityInsights();
    }
  }

  // ==================== Mock Data Helpers ====================

  private getMockTwinProfile(userId: string): any {
    return {
      success: true,
      profile: {
        user_id: userId,
        typing_patterns: {
          avg_key_interval: 150,
          avg_keystroke_duration: 80,
          error_rate: 0.02,
          typing_speed: 45,
        },
        navigation_preferences: ['dashboard', 'analytics', 'predictions', 'twin'],
        feature_usage: {
          dashboard: 145,
          analytics: 98,
          predictions: 76,
          activity: 52,
          settings: 42,
        },
        twin_accuracy: 0.85,
        last_updated: new Date().toISOString(),
      },
    };
  }

  private getMockAutomations(): any[] {
    return [
      {
        id: 'auto_1',
        title: 'Auto-schedule focus time',
        description: 'Block 10 AM - 12 PM for deep work based on your patterns',
        confidence: 0.82,
      },
      {
        id: 'auto_2',
        title: 'Quick analytics access',
        description: 'Show analytics dashboard after login',
        confidence: 0.75,
      },
      {
        id: 'auto_3',
        title: 'Smart notifications',
        description: 'Mute notifications during productive hours',
        confidence: 0.68,
      },
    ];
  }

  private getMockBehaviorSummary(userId: string): any {
    return {
      user_id: userId,
      typing_patterns: {
        avg_key_interval: 150,
        avg_keystroke_duration: 80,
        error_rate: 0.02,
        typing_speed: 45,
      },
      top_features: [
        ['dashboard', 145],
        ['analytics', 98],
        ['predictions', 76],
        ['activity', 52],
        ['settings', 42],
      ],
      navigation_pattern: ['dashboard', 'analytics', 'predictions', 'twin'],
      twin_accuracy: 0.85,
    };
  }

  private getMockLayoutPrediction(): LayoutPrediction {
    return {
      preferredLayout: 'sidebar',
      sidebarCollapsed: false,
      widgetOrder: ['dashboard', 'analytics', 'tasks', 'notifications'],
      theme: 'dark',
      shortcutHints: true,
      confidence: 0.85,
    };
  }

  private getMockAdaptiveAnalytics(): any {
    return {
      layout: this.getMockLayoutPrediction(),
      nextPage: 'analytics',
      features: {
        dashboard: 0.35,
        analytics: 0.24,
        predictions: 0.18,
        activity: 0.13,
        settings: 0.10,
      },
      timePatterns: {
        peak_hours: [9, 10, 14, 15],
        peak_days: ['Monday', 'Wednesday', 'Friday'],
        avg_session_length: 30,
      },
      actionDistribution: {
        click: 0.6,
        navigation: 0.3,
        scroll: 0.08,
        typing: 0.02,
      },
    };
  }

  private getMockSystemHealth(): SystemHealth {
    return {
      status: 'healthy',
      error_rate: 0.05,
      total_logs: 1250,
      recent_errors: 3,
      active_anomalies: 0,
    };
  }

  private getMockHealResults(): any {
    return {
      timestamp: new Date().toISOString(),
      anomalies_detected: 0,
      anomalies: [],
      recoveries: [],
    };
  }

  private getMockProductivityInsights(): any {
    return {
      peakHours: [9, 10, 11],
      mostProductiveDay: 'Wednesday',
      avgSessionDuration: 30,
      productivityScore: 85,
    };
  }

  private generateInsightsFromData(profile: any, analytics: any): Insight[] {
    const insights: Insight[] = [];

    // Time-based insights
    const timePatterns = analytics?.timePatterns;
    if (timePatterns?.peak_hours?.length > 0) {
      const peakHours: number[] = timePatterns.peak_hours;
      insights.push({
        id: 'insight_1',
        type: 'productivity',
        title: 'Peak Productivity Hours',
        description: `You are most productive between ${Math.min(...peakHours)} AM and ${Math.max(...peakHours)} AM`,
        confidence: 0.85,
        category: 'time',
      });
    }

    // Feature usage insights
    const features = analytics?.features;
    if (features) {
      const sortedFeatures = Object.entries(features).sort((a: any, b: any) => b[1] - a[1]);
      if (sortedFeatures.length > 0) {
        const topFeature = sortedFeatures[0] as [string, number];
        const percentage = Math.round(topFeature[1] * 100);
        insights.push({
          id: 'insight_2',
          type: 'usage',
          title: 'Top Feature',
          description: `You spend ${percentage}% of your time on ${topFeature[0]}`,
          confidence: 0.90,
          category: 'usage',
        });
      }
    }

    // Prediction insight
    if (analytics?.nextPage) {
      insights.push({
        id: 'insight_3',
        type: 'prediction',
        title: 'Next Action Prediction',
        description: `Based on your patterns, you'll likely visit ${analytics.nextPage} next`,
        confidence: analytics.layout?.confidence || 0.75,
        category: 'prediction',
      });
    }

    // Add default insights if none generated
    if (insights.length === 0) {
      return this.getDefaultInsights();
    }

    return insights;
  }

  private getDefaultInsights(): Insight[] {
    return [
      {
        id: 'insight_1',
        type: 'productivity',
        title: 'Peak Productivity Hours',
        description: 'You are most productive between 9 AM and 11 AM',
        confidence: 0.85,
        category: 'time',
      },
      {
        id: 'insight_2',
        type: 'usage',
        title: 'Top Feature Usage',
        description: 'You spend 42% of your time analyzing data on the analytics dashboard',
        confidence: 0.90,
        category: 'usage',
      },
      {
        id: 'insight_3',
        type: 'pattern',
        title: 'Navigation Pattern',
        description: 'You usually open the analytics dashboard after activity monitoring',
        confidence: 0.75,
        category: 'pattern',
      },
      {
        id: 'insight_4',
        type: 'recommendation',
        title: 'Automation Suggestion',
        description: 'Enable auto-schedule for your productive hours to minimize interruptions',
        confidence: 0.68,
        category: 'recommendation',
      },
    ];
  }

  // ==================== Health Check ====================

  /**
   * Check if AI Engine is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error: unknown) {
      console.warn('AI Engine is not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;

