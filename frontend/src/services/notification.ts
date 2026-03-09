/**
 * Notification Service
 * Handles all notification-related API calls with caching
 */

import api from '../utils/api';

export type NotificationType = 
  | 'info' 
  | 'warning' 
  | 'success' 
  | 'error' 
  | 'alert' 
  | 'productivity' 
  | 'behavior' 
  | 'system' 
  | 'recommendation' 
  | 'AI_insight' 
  | 'system_alert';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  productivityAlerts: boolean;
  behaviorAlerts: boolean;
  systemAlerts: boolean;
  recommendations: boolean;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Simple cache for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class NotificationService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheTTL = 10000; // 10 seconds cache TTL

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
   * Clear cache for notifications
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all notifications with unread count (with caching)
   */
  async getNotifications(forceRefresh = false): Promise<NotificationsResponse> {
    const cacheKey = 'notifications';
    
    // Return cached data if available and not forcing refresh
    if (!forceRefresh) {
      const cached = this.getCached<NotificationsResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const response = await api.getNotifications();
    const data = response.data;
    
    // Cache the response
    this.setCache(cacheKey, data);
    
    return data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.getUnreadCount();
    return response.data.unreadCount;
  }

  /**
   * Create a new notification
   */
  async createNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<Notification> {
    const response = await api.createNotification(data);
    return response.data.notification;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.markNotificationRead(notificationId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await api.markAllNotificationsRead();
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.deleteNotification(notificationId);
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.updateNotificationPreferences(preferences);
    return response.data.preferences;
  }
}

export const notificationService = new NotificationService();
export default notificationService;

