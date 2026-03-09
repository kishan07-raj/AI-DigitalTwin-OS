/**
 * Activity Service
 * Handles all activity tracking and session management API calls
 */

import api from '../utils/api';

export interface Activity {
  id: string;
  userId: string;
  type: string;
  element: string;
  page: string;
  duration?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: number;
  events: number;
}

export interface ActivityParams {
  type?: string;
  page?: string;
  limit?: number;
  skip?: number;
}

export interface SessionsParams {
  limit?: number;
  skip?: number;
}

class ActivityService {
  /**
   * Track user activity
   */
  async trackActivity(data: {
    type: string;
    element: string;
    page: string;
    duration?: number;
    metadata?: Record<string, any>;
  }): Promise<Activity> {
    const response = await api.trackActivity(data);
    return response.data.activity;
  }

  /**
   * Get activities with optional filters
   */
  async getActivities(params?: ActivityParams): Promise<{ activities: Activity[]; pagination: any }> {
    const response = await api.getActivities(params);
    return response.data.data;
  }

  /**
   * Create a new session
   */
  async createSession(data: {
    startTime: string;
    page?: string;
    metadata?: Record<string, any>;
  }): Promise<Session> {
    const response = await api.createSession(data);
    return response.data.session;
  }

  /**
   * End an existing session
   */
  async endSession(sessionId: string): Promise<Session> {
    const response = await api.endSession(sessionId);
    return response.data.session;
  }

  /**
   * Get sessions with pagination
   */
  async getSessions(params?: SessionsParams): Promise<{ sessions: Session[]; pagination: any }> {
    const response = await api.getSessions(params);
    return response.data.data;
  }
}

export const activityService = new ActivityService();
export default activityService;

