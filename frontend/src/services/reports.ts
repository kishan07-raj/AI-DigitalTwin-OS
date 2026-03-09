/**
 * Reports Service
 * Handles all report generation and retrieval API calls
 */

import api from '../utils/api';

// Extended Report Data interface
export interface ReportData {
  // Basic metrics
  totalSessions: number;
  totalActivities: number;
  totalActivityTime: number;
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
  
  // Chart data
  activityByHour: Array<{ hour: number; count: number }>;
  activityByDay: Array<{ day: string; count: number }>;
  
  // Legacy fields for compatibility
  topFeatures?: string[];
  insights?: string[];
  predictions?: any[];
}

export interface AIInsight {
  id: string;
  type: 'productivity' | 'usage' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  category: string;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: string;
}

export interface BehaviorPattern {
  type: string;
  description: string;
  frequency: number;
}

export interface Report {
  id: string;
  userId: string;
  type: 'daily' | 'weekly' | 'monthly';
  title: string;
  summary: string;
  data: ReportData;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ReportGenerationRequest {
  type: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}

// Simple cache for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ReportsService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheTTL = 30000; // 30 seconds cache TTL for reports

  /**
   * Get cached data if still valid
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.cacheTTL) {
      return entry.data as T;
    }
    return null;
  }

  /**
   * Set cache entry
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear cache for reports
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get daily report (with caching)
   */
  async getDailyReport(forceRefresh = false): Promise<Report> {
    const cacheKey = 'report_daily';
    
    if (!forceRefresh) {
      const cached = this.getCached<Report>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const response = await api.getDailyReport();
    const report = response.data.report;
    this.setCache(cacheKey, report);
    return report;
  }

  /**
   * Get weekly report (with caching)
   */
  async getWeeklyReport(forceRefresh = false): Promise<Report> {
    const cacheKey = 'report_weekly';
    
    if (!forceRefresh) {
      const cached = this.getCached<Report>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const response = await api.getWeeklyReport();
    const report = response.data.report;
    this.setCache(cacheKey, report);
    return report;
  }

  /**
   * Get monthly report (with caching)
   */
  async getMonthlyReport(forceRefresh = false): Promise<Report> {
    const cacheKey = 'report_monthly';
    
    if (!forceRefresh) {
      const cached = this.getCached<Report>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const response = await api.getMonthlyReport();
    const report = response.data.report;
    this.setCache(cacheKey, report);
    return report;
  }

  /**
   * Generate a new report
   */
  async generateReport(type: 'daily' | 'weekly' | 'monthly'): Promise<Report> {
    const response = await api.generateReport(type);
    return response.data.report;
  }

  /**
   * Get all reports
   */
  async getReports(): Promise<Report[]> {
    const response = await api.getReports();
    return response.data.reports;
  }

  /**
   * Get a specific report
   */
  async getReport(reportId: string): Promise<Report> {
    const response = await api.getReport(reportId);
    return response.data.report;
  }

  /**
   * Download a report as PDF
   */
  async downloadReportAsPDF(reportId: string): Promise<void> {
    const response = await api.downloadReport(reportId, 'pdf');
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download a report as JSON
   */
  async downloadReportAsJSON(reportId: string): Promise<void> {
    const response = await api.downloadReport(reportId, 'json');
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportId}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Refresh/regenerate a report
   */
  async refreshReport(reportId: string): Promise<Report> {
    const response = await api.refreshReport(reportId);
    return response.data.report;
  }

  /**
   * Get cached report if available
   */
  async getReportWithCache(type: 'daily' | 'weekly' | 'monthly'): Promise<Report> {
    switch (type) {
      case 'daily':
        return this.getDailyReport();
      case 'weekly':
        return this.getWeeklyReport();
      case 'monthly':
        return this.getMonthlyReport();
    }
  }
}

export const reportsService = new ReportsService();
export default reportsService;

