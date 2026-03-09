/**
 * Socket.io Client Service
 * Handles real-time communication with backend
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize socket connection
   */
  connect(token?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('socket_connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('socket_disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });

    // Notification events
    this.socket.on('notification_new', (data) => {
      console.log('New notification received:', data);
      this.emit('notification_new', data);
    });

    // AI Engine events
    this.socket.on('activity_update', (data) => {
      this.emit('activity_update', data);
    });

    this.socket.on('prediction_update', (data) => {
      this.emit('prediction_update', data);
    });

    this.socket.on('insight_update', (data) => {
      this.emit('insight_update', data);
    });

    this.socket.on('system_health', (data) => {
      this.emit('system_health', data);
    });

    this.socket.on('system_alert', (data) => {
      this.emit('system_alert', data);
    });

    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
      this.emit('authenticated', data);
    });
  }

  /**
   * Authenticate user with socket
   */
  authenticate(userId: string): void {
    this.socket?.emit('authenticate', userId);
  }

  /**
   * Track activity
   */
  trackActivity(data: {
    userId: string;
    type: string;
    element: string;
    page: string;
    duration?: number;
  }): void {
    this.socket?.emit('track_activity', data);
  }

  /**
   * Request predictions
   */
  requestPredictions(userId: string): void {
    this.socket?.emit('get_predictions', userId);
  }

  /**
   * Request insights
   */
  requestInsights(userId: string): void {
    this.socket?.emit('get_insights', userId);
  }

  /**
   * Subscribe to event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  /**
   * Unsubscribe from event
   */
  off(event: string, callback: EventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit to local listeners
   */
  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.disconnect();
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

// Event types for TypeScript
export interface SocketEvents {
  socket_connected: { connected: boolean };
  socket_disconnected: { reason: string };
  notification_new: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    data?: Record<string, any>;
    createdAt: string;
  };
  activity_update: {
    type: string;
    element: string;
    page: string;
    timestamp: string;
    simulated?: boolean;
  };
  prediction_update: {
    layout: any;
    nextPage: string | null;
    analytics: any;
    timestamp: string;
  };
  insight_update: {
    insights: any[];
    productivity: any;
    timestamp: string;
  };
  system_health: {
    status: string;
    error_rate: number;
    total_logs: number;
    recent_errors: number;
    active_anomalies: number;
  };
  system_alert: {
    type: string;
    severity: string;
    message: string;
    details: any[];
    timestamp: string;
  };
  authenticated: {
    success: boolean;
    userId: string;
    socketId: string;
  };
}

