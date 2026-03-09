/**
 * useSocket Hook
 * React hook for Socket.io real-time functionality
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { socketService, SocketEvents } from '../utils/socket';
import { useStore } from '../store';

interface UseSocketOptions {
  autoConnect?: boolean;
  authenticateOnConnect?: boolean;
}

interface SocketState {
  isConnected: boolean;
  socketId: string | null;
}

/**
 * Main useSocket hook
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, authenticateOnConnect = true } = options;
  const { user, isAuthenticated, token } = useStore();
  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    socketId: null,
  });

  // Connect on mount if authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && token) {
      socketService.connect(token);
    }
  }, [autoConnect, isAuthenticated, token]);

  // Listen for connection events
  useEffect(() => {
    const handleConnect = () => {
      setSocketState({
        isConnected: true,
        socketId: socketService.getSocketId() || null,
      });
      if (authenticateOnConnect && user?.id) {
        socketService.authenticate(user.id);
      }
    };

    const handleDisconnect = () => {
      setSocketState(prev => ({
        ...prev,
        isConnected: false,
      }));
    };

    socketService.on('socket_connected', handleConnect);
    socketService.on('socket_disconnected', handleDisconnect);

    // Check initial connection status
    if (socketService.isConnected()) {
      handleConnect();
    }

    return () => {
      socketService.off('socket_connected', handleConnect);
      socketService.off('socket_disconnected', handleDisconnect);
    };
  }, [authenticateOnConnect, user?.id]);

  // Track activity
  const trackActivity = useCallback((data: {
    type: string;
    element: string;
    page: string;
    duration?: number;
  }) => {
    if (user?.id) {
      socketService.trackActivity({
        userId: user.id,
        ...data,
      });
    }
  }, [user?.id]);

  // Request predictions
  const requestPredictions = useCallback(() => {
    if (user?.id) {
      socketService.requestPredictions(user.id);
    }
  }, [user?.id]);

  // Request insights
  const requestInsights = useCallback(() => {
    if (user?.id) {
      socketService.requestInsights(user.id);
    }
  }, [user?.id]);

  return {
    ...socketState,
    trackActivity,
    requestPredictions,
    requestInsights,
  };
}

/**
 * Hook for subscribing to specific socket events
 */
export function useSocketEvent<T extends keyof SocketEvents>(
  event: T,
  callback: (data: SocketEvents[T]) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: SocketEvents[T]) => {
      callbackRef.current(data);
    };

    socketService.on(event, handler);

    return () => {
      socketService.off(event, handler);
    };
  }, [event]);
}

/**
 * Hook for activity updates
 */
export function useActivityUpdates() {
  const [activities, setActivities] = useState<SocketEvents['activity_update'][]>([]);
  const maxActivities = 50;

  useSocketEvent('activity_update', (data) => {
    setActivities(prev => {
      const updated = [data, ...prev];
      return updated.slice(0, maxActivities);
    });
  });

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  return { activities, clearActivities };
}

/**
 * Hook for real-time predictions
 */
export function usePredictionUpdates() {
  const [predictions, setPredictions] = useState<SocketEvents['prediction_update'] | null>(null);

  useSocketEvent('prediction_update', (data) => {
    setPredictions(data);
  });

  return predictions;
}

/**
 * Hook for real-time insights
 */
export function useInsightUpdates() {
  const [insights, setInsights] = useState<SocketEvents['insight_update'] | null>(null);

  useSocketEvent('insight_update', (data) => {
    setInsights(data);
  });

  return insights;
}

/**
 * Hook for system health
 */
export function useSystemHealth() {
  const [health, setHealth] = useState<SocketEvents['system_health'] | null>(null);

  useSocketEvent('system_health', (data) => {
    setHealth(data);
  });

  return health;
}

/**
 * Hook for system alerts
 */
export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<SocketEvents['system_alert'][]>([]);

  useSocketEvent('system_alert', (data) => {
    setAlerts(prev => [data, ...prev].slice(0, 20));
  });

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, clearAlerts };
}

