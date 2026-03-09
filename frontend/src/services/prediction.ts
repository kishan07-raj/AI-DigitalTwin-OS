/**
 * Prediction Service
 * Handles all AI prediction-related API calls
 */

import api from '../utils/api';

export interface Prediction {
  id: string;
  userId: string;
  type: string;
  model: string;
  prediction: any;
  confidence: number;
  createdAt: string;
}

export interface PredictionFeedback {
  predictionId: string;
  feedback: 'accurate' | 'inaccurate' | 'partial';
  comment?: string;
}

class PredictionService {
  /**
   * Get predictions for a user
   */
  async getPredictions(type?: string): Promise<{ ui: Prediction; behavior: Prediction }> {
    const response = await api.getPredictions(type);
    return response.data.data;
  }

  /**
   * Submit feedback for a prediction
   */
  async submitFeedback(predictionId: string, feedback: string): Promise<void> {
    await api.submitFeedback(predictionId, feedback);
  }

  /**
   * Get prediction history
   */
  async getPredictionHistory(params?: { type?: string; limit?: number }): Promise<Prediction[]> {
    const response = await api.getPredictionHistory(params);
    return response.data.predictions;
  }

  /**
   * Get layout prediction
   */
  async getLayoutPrediction(userId: string, device?: string): Promise<any> {
    const response = await api.getLayoutPrediction(userId, device);
    return response.data.layout;
  }

  /**
   * Predict next page
   */
  async predictNextPage(userId: string): Promise<string | null> {
    const response = await api.predictNextPage(userId);
    return response.data.nextPage;
  }
}

export const predictionService = new PredictionService();
export default predictionService;

