/**
 * Notification Service
 * Handles notification creation and triggering
 */

import { Notification, INotification } from '../models/Notification';
import { socketService } from './socketService';

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

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(input: CreateNotificationInput): Promise<INotification> {
    const notification = await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      read: false,
    });

    // Emit socket event for real-time notification
    this.emitNotificationEvent(notification);

    return notification;
  }

  /**
   * Emit notification event via socket
   */
  private emitNotificationEvent(notification: INotification): void {
    const notificationData = {
      id: notification._id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      data: notification.data,
      createdAt: notification.createdAt,
    };

    // Send to specific user
    socketService.broadcastToUser(notification.userId, 'notification_new', notificationData);
    
    // Also emit a general notification event for system-wide alerts
    if (notification.type === 'system_alert' || notification.type === 'error' || notification.type === 'warning') {
      socketService.broadcast('system_alert', {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.createdAt,
        notificationId: notification._id,
      });
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<INotification[]> {
    return Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, read: false });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndDelete({ _id: notificationId, userId });
  }

  /**
   * Trigger notification for AI prediction
   */
  async notifyPrediction(userId: string, prediction: any): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'AI_insight',
      title: 'New AI Prediction Available',
      message: `AI has generated a new prediction with ${Math.round(prediction.confidence * 100)}% confidence`,
      data: { prediction },
    });
  }

  /**
   * Trigger notification for anomaly detected
   */
  async notifyAnomaly(userId: string, anomaly: any): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'warning',
      title: 'Anomaly Detected',
      message: anomaly.message || 'An unusual pattern has been detected in your activity',
      data: { anomaly },
    });
  }

  /**
   * Trigger notification for system health issue
   */
  async notifySystemHealth(userId: string, healthData: any): Promise<INotification | null> {
    if (healthData.status === 'healthy') {
      return null;
    }

    return this.createNotification({
      userId,
      type: 'system_alert',
      title: 'System Health Alert',
      message: `System status: ${healthData.status}. Error rate: ${healthData.error_rate}%`,
      data: { health: healthData },
    });
  }

  /**
   * Trigger notification for automation triggered
   */
  async notifyAutomation(userId: string, automation: any): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'success',
      title: 'Automation Triggered',
      message: automation.message || 'An automation has been executed based on your patterns',
      data: { automation },
    });
  }

  /**
   * Trigger notification for new insight generated
   */
  async notifyInsight(userId: string, insight: any): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'AI_insight',
      title: 'New AI Insight',
      message: insight.description || insight.title,
      data: { insight },
    });
  }

  /**
   * Trigger notification for productivity tip
   */
  async notifyProductivity(userId: string, tip: any): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'productivity',
      title: 'Productivity Tip',
      message: tip.message,
      data: { tip },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;

