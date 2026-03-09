/**
 * Insights Service
 * Handles all AI insights-related API calls
 */

import api from '../utils/api';

export interface Insight {
  id: string;
  type: 'productivity' | 'usage' | 'prediction' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  category: string;
}

export interface ProductivityInsights {
  peakHours: number[];
  mostProductiveDay: string;
  avgSessionDuration: number;
  productivityScore: number;
}

class InsightsService {
  /**
   * Generate AI insights for a user
   */
  async getInsights(userId: string): Promise<Insight[]> {
    const response = await api.getInsights(userId);
    return response.data.insights;
  }

  /**
   * Get productivity insights
   */
  async getProductivityInsights(userId: string): Promise<ProductivityInsights> {
    const response = await api.getProductivityInsights(userId);
    return response.data.productivity;
  }
}

export const insightsService = new InsightsService();
export default insightsService;

