/**
 * useNotifications Hook
 * Handles real-time notifications from socket events with proper cleanup
 */

import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { socketService } from '../utils/socket';
import { notificationService, Notification } from '../services/notification';

export function useNotifications() {
  const { 
    user, 
    isAuthenticated, 
    notifications, 
    unreadCount,
    setNotifications, 
    addNotification, 
    setUnreadCount,
    clearUnreadCount 
  } = useStore();

  // Use ref to track if component is mounted
  const isMounted = useRef(true);
  // Use ref to track if fetch is in progress
  const isFetching = useRef(false);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || isFetching.current) return;
    
    isFetching.current = true;
    
    try {
      const data = await notificationService.getNotifications();
      // Only update state if component is still mounted
      if (isMounted.current) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      isFetching.current = false;
    }
  }, [isAuthenticated, setNotifications, setUnreadCount]);

  // Handle new notification from socket
  const handleNewNotification = useCallback((notification: Notification) => {
    // Add to notifications list and increment unread count
    addNotification(notification);
  }, [addNotification]);

  // Setup socket listeners
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    if (!isAuthenticated || !user?.id) return;

    // Fetch initial notifications
    fetchNotifications();

    // Listen for new notifications
    socketService.on('notification_new', handleNewNotification);

    // Listen for system alerts
    socketService.on('system_alert', (data: any) => {
      console.log('System alert received:', data);
      // Could auto-generate notification from system alert
    });

    // Cleanup function
    return () => {
      isMounted.current = false;
      socketService.off('notification_new', handleNewNotification);
    };
  }, [isAuthenticated, user?.id, fetchNotifications, handleNewNotification]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      
      // Decrement unread count
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [notifications, setNotifications, unreadCount, setUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      clearUnreadCount();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications, setNotifications, clearUnreadCount]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Decrement unread count if deleted notification was unread
      if (notification && !notification.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications, setNotifications, unreadCount, setUnreadCount]);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

export default useNotifications;

