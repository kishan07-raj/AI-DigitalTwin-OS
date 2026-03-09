/**
 * System Service
 * Handles all system-related API calls (health, metrics, etc.)
 */

import api from '../utils/api';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  error_rate: number;
  total_logs: number;
  recent_errors: number;
  active_anomalies: number;
  timestamp: string;
}

export interface Anomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  uptime: number;
  requestsPerMinute: number;
  activeConnections: number;
}

class SystemService {
  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.getSystemHealth();
    return response.data.health;
  }

  /**
   * Get detailed system health
   */
  async getSystemHealthDetailed(): Promise<any> {
    const response = await api.getSystemHealthDetailed();
    return response.data;
  }

  /**
   * Get anomaly detection results
   */
  async getAnomalyDetection(): Promise<Anomaly[]> {
    const response = await api.getAnomalyDetection();
    return response.data.anomalies;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await api.getSystemMetrics();
    return response.data.metrics;
  }

  /**
   * Check and heal system
   */
  async checkAndHeal(): Promise<any> {
    const response = await api.checkAndHeal();
    return response.data.results;
  }

  /**
   * Get AI Engine health
   */
  async getAIEngineHealth(): Promise<SystemHealth> {
    const response = await api.getAIEngineHealth();
    return response.data.health;
  }
}

export const systemService = new SystemService();
export default systemService;

