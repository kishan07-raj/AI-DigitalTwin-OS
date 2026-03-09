import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Notification } from '../models';
import { notificationService, NotificationType } from '../services/notificationService';

const router = Router();

// Create a new notification
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, title, message, data } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Type, title, and message are required' }
      });
    }

    const notification = await notificationService.createNotification({
      userId,
      type: type as NotificationType,
      title,
      message,
      data,
    });

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATION_CREATE_FAILED', message: 'Failed to create notification' }
    });
  }
});

// Get all notifications for current user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notifications = await notificationService.getUserNotifications(userId, 50);
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATIONS_FETCH_FAILED', message: 'Failed to fetch notifications' }
    });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: { code: 'COUNT_FETCH_FAILED', message: 'Failed to fetch unread count' }
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    const notification = await notificationService.markAsRead(id, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: 'Failed to update notification' }
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    await notificationService.markAllAsRead(userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: 'Failed to update notifications' }
    });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    await notificationService.deleteNotification(id, userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: 'Failed to delete notification' }
    });
  }
});

// Update notification preferences
router.put('/preferences', authenticate, async (req: Request, res: Response) => {
  try {
    // In a full implementation, this would update user preferences
    const preferences = req.body;
    
    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: 'Failed to update preferences' }
    });
  }
});

export default router;

