import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'ai-digitaltwin-access-token';
const REFRESH_TOKEN_KEY = 'ai-digitaltwin-refresh-token';

// Track if we're currently trying to restore auth
let isRestoringAuth = false;

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - always include token if available
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 errors - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Don't try to refresh if we're already refreshing
          if (isRestoringAuth) {
            return Promise.reject(error);
          }
          
          // Try to refresh the token
          if (this.refreshToken) {
            isRestoringAuth = true;
            try {
              const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                refreshToken: this.refreshToken,
              });
              
              if (response.data.success) {
                const newAccessToken = response.data.data.accessToken;
                const newRefreshToken = response.data.data.refreshToken;
                
                // Store new tokens
                this.setToken(newAccessToken, newRefreshToken);
                
                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed - clear tokens and redirect to login
              this.removeToken();
              if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
              }
              return Promise.reject(refreshError);
            } finally {
              isRestoringAuth = false;
            }
          } else {
            // No refresh token - redirect to login
            this.removeToken();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    // Load tokens from storage on initialization
    this.loadTokens();
  }

  // Set both access and refresh tokens
  setToken(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        this.refreshToken = refreshToken;
      }
    }
  }

  // Remove tokens
  removeToken() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  // Load tokens from storage
  loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    }
  }

  // Get current access token
  getToken(): string | null {
    return this.accessToken;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Mark that we're restoring auth
  setRestoringAuth(value: boolean) {
    isRestoringAuth = value;
  }

  // Auth endpoints
  async register(data: { email: string; password: string; name: string }): Promise<AxiosResponse> {
    return this.client.post('/auth/register', data);
  }

  async login(data: { email: string; password: string }): Promise<AxiosResponse> {
    const response = await this.client.post('/auth/login', data);
    
    // Store tokens from login response
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data;
      if (accessToken) {
        this.setToken(accessToken, refreshToken);
      }
    }
    
    return response;
  }

  async getMe(): Promise<AxiosResponse> {
    return this.client.get('/auth/me');
  }

  async updateProfile(data: { name?: string; preferences?: any }): Promise<AxiosResponse> {
    return this.client.put('/auth/profile', data);
  }

  async logout(): Promise<AxiosResponse> {
    try {
      const response = await this.client.post('/auth/logout');
      return response;
    } finally {
      this.removeToken();
    }
  }

  // Activity endpoints
  async trackActivity(data: any): Promise<AxiosResponse> {
    return this.client.post('/activity/track', data);
  }

  async getActivities(params?: { type?: string; page?: string; limit?: number; skip?: number }): Promise<AxiosResponse> {
    return this.client.get('/activity', { params });
  }

  async createSession(data: any): Promise<AxiosResponse> {
    return this.client.post('/activity/session', data);
  }

  async endSession(sessionId: string): Promise<AxiosResponse> {
    return this.client.put('/activity/session/end', { sessionId });
  }

  async getSessions(params?: { limit?: number; skip?: number }): Promise<AxiosResponse> {
    return this.client.get('/activity/sessions', { params });
  }

  // History endpoints
  async getHistory(params?: { type?: string; page?: number; limit?: number }): Promise<AxiosResponse> {
    return this.client.get('/history', { params });
  }

  async getActivityHistory(params?: { type?: string; page?: number; limit?: number }): Promise<AxiosResponse> {
    return this.client.get('/history/activity', { params });
  }

  async clearHistory(data?: { type?: string; olderThan?: string }): Promise<AxiosResponse> {
    return this.client.delete('/history', { data });
  }

  // Export endpoints
  async exportActivities(params?: { format?: string; type?: string; limit?: number }): Promise<AxiosResponse> {
    return this.client.get('/export/activities', { params });
  }

  async exportSessions(params?: { format?: string; limit?: number }): Promise<AxiosResponse> {
    return this.client.get('/export/sessions', { params });
  }

  async exportAllData(params?: { format?: string; dataTypes?: string }): Promise<AxiosResponse> {
    return this.client.get('/export/all', { params });
  }

  async exportProfile(): Promise<AxiosResponse> {
    return this.client.get('/export/profile');
  }

  async getDataSummary(): Promise<AxiosResponse> {
    return this.client.get('/export/summary');
  }

  // Twin actions endpoints
  async getTwinStatus(): Promise<AxiosResponse> {
    return this.client.get('/twin/status');
  }

  async resetLearning(): Promise<AxiosResponse> {
    return this.client.post('/twin/reset-learning');
  }

  async triggerAutomation(data: { actionType: string; parameters?: any }): Promise<AxiosResponse> {
    return this.client.post('/twin/automation', data);
  }

  async updateBehaviorProfile(data: { behaviorProfile: any }): Promise<AxiosResponse> {
    return this.client.put('/twin/behavior-profile', data);
  }

  // AI Prediction endpoints
  async getPredictions(type?: string): Promise<AxiosResponse> {
    return this.client.get('/ai', { params: { type } });
  }

  async submitFeedback(predictionId: string, feedback: string): Promise<AxiosResponse> {
    return this.client.post('/ai/feedback', { predictionId, feedback });
  }

  async getPredictionHistory(params?: { type?: string; limit?: number }): Promise<AxiosResponse> {
    return this.client.get('/ai/history', { params });
  }

  // Health check
  async healthCheck(): Promise<AxiosResponse> {
    return this.client.get('/health');
  }

  // System endpoints
  async getSystemHealth(): Promise<AxiosResponse> {
    return this.client.get('/system/health');
  }

  async getSystemHealthDetailed(): Promise<AxiosResponse> {
    return this.client.get('/system/health/detailed');
  }

  async getAnomalyDetection(): Promise<AxiosResponse> {
    return this.client.get('/system/anomaly-detection');
  }

  async getSystemMetrics(): Promise<AxiosResponse> {
    return this.client.get('/system/metrics');
  }

  async runSystemCheck(): Promise<AxiosResponse> {
    return this.client.post('/system/check-heal');
  }

  // AI Engine endpoints (Digital Twin)
  async getDigitalTwinProfile(userId: string): Promise<AxiosResponse> {
    return this.client.get(`/ai-engine/twin/profile/${userId}`);
  }

  async createDigitalTwinProfile(userId: string): Promise<AxiosResponse> {
    return this.client.post(`/ai-engine/twin/profile/${userId}`);
  }

  async getAutomations(userId: string): Promise<AxiosResponse> {
    return this.client.get(`/ai-engine/twin/automations/${userId}`);
  }

  async getBehaviorSummary(userId: string): Promise<AxiosResponse> {
    return this.client.get(`/ai-engine/twin/summary/${userId}`);
  }

  // AI Engine endpoints (Adaptive UI)
  async getLayoutPrediction(userId: string, device?: string): Promise<AxiosResponse> {
    return this.client.get(`/ai-engine/adaptive/layout/${userId}`, { params: { device } });
  }

  async predictNextPage(userId: string): Promise<AxiosResponse> {
    return this.client.get(`/ai-engine/adaptive/next-page/${userId}`);
  }

  async getAdaptiveAnalytics(userId: string): Promise<AxiosResponse> {
    return this.client.get(`/ai-engine/adaptive/analytics/${userId}`);
  }

  // AI Engine endpoints (Self-Healing)
  async getAIEngineHealth(): Promise<AxiosResponse> {
    return this.client.get('/ai-engine/healing/health');
  }

  async checkAndHeal(): Promise<AxiosResponse> {
    return this.client.post('/ai-engine/healing/check');
  }

  // AI Engine endpoints (Insights)
  async getInsights(userId: string): Promise<AxiosResponse> {
    return this.client.get(`/ai-engine/insights/${userId}`);
  }

  async getProductivityInsights(userId: string): Promise<AxiosResponse> {
    return this.client.get(`/ai-engine/insights/productivity/${userId}`);
  }

  // Team Analytics endpoints
  async getTeamAnalytics(teamId: string): Promise<AxiosResponse> {
    return this.client.get(`/analytics/team/${teamId}`);
  }

  async getUserComparisons(teamId: string): Promise<AxiosResponse> {
    return this.client.get(`/analytics/team/${teamId}/comparisons`);
  }

  async getProductivityTrends(userId: string, days: number): Promise<AxiosResponse> {
    return this.client.get(`/analytics/trends/${userId}`, { params: { days } });
  }

  // Reports endpoints
  async generateReport(type: 'daily' | 'weekly' | 'monthly'): Promise<AxiosResponse> {
    return this.client.post(`/reports/generate`, { type });
  }

  async getDailyReport(): Promise<AxiosResponse> {
    return this.client.get('/reports/daily');
  }

  async getWeeklyReport(): Promise<AxiosResponse> {
    return this.client.get('/reports/weekly');
  }

  async getMonthlyReport(): Promise<AxiosResponse> {
    return this.client.get('/reports/monthly');
  }

  async getReports(): Promise<AxiosResponse> {
    return this.client.get('/reports');
  }

  async getReport(reportId: string): Promise<AxiosResponse> {
    return this.client.get(`/reports/${reportId}`);
  }

  async downloadReport(reportId: string, format: 'pdf' | 'json' = 'pdf'): Promise<AxiosResponse> {
    return this.client.get(`/reports/${reportId}/download`, { 
      params: { format },
      responseType: 'blob' 
    });
  }

  async refreshReport(reportId: string): Promise<AxiosResponse> {
    return this.client.post(`/reports/${reportId}/refresh`);
  }

  // Notifications endpoints
  async getNotifications(): Promise<AxiosResponse> {
    return this.client.get('/notifications');
  }

  async getUnreadCount(): Promise<AxiosResponse> {
    return this.client.get('/notifications/unread-count');
  }

  async createNotification(data: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<AxiosResponse> {
    return this.client.post('/notifications', data);
  }

  async markNotificationRead(notificationId: string): Promise<AxiosResponse> {
    return this.client.patch(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead(): Promise<AxiosResponse> {
    return this.client.put('/notifications/read-all');
  }

  async deleteNotification(notificationId: string): Promise<AxiosResponse> {
    return this.client.delete(`/notifications/${notificationId}`);
  }

  async updateNotificationPreferences(preferences: any): Promise<AxiosResponse> {
    return this.client.put('/notifications/preferences', preferences);
  }

  // Teams endpoints
  async getTeams(): Promise<AxiosResponse> {
    return this.client.get('/teams');
  }

  async getTeam(teamId: string): Promise<AxiosResponse> {
    return this.client.get(`/teams/${teamId}`);
  }

  async createTeam(data: { name: string; description?: string }): Promise<AxiosResponse> {
    return this.client.post('/teams', data);
  }

  async addTeamMember(teamId: string, userEmail: string): Promise<AxiosResponse> {
    return this.client.post(`/teams/${teamId}/members`, { email: userEmail });
  }

  async removeTeamMember(teamId: string, userId: string): Promise<AxiosResponse> {
    return this.client.delete(`/teams/${teamId}/members/${userId}`);
  }
}

export const api = new ApiClient();
export default api;
