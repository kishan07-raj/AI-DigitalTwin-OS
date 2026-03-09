/**
 * Socket.io Service
 * Handles real-time communication between server and clients
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { aiService } from './aiService';

interface UserSocket {
  userId: string;
  socketId: string;
}

class SocketService {
  private io: SocketServer | null = null;
  private userSockets: Map<string, UserSocket> = new Map();
  private activityInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer): SocketServer {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    this.startActivitySimulation();

    console.log('Socket.io server initialized');
    return this.io;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (userId: string) => {
        this.handleAuthentication(socket, userId);
      });

      // Handle activity tracking
      socket.on('track_activity', (data: any) => {
        this.handleActivityTracking(socket, data);
      });

      // Handle prediction requests
      socket.on('get_predictions', (userId: string) => {
        this.handlePredictionRequest(socket, userId);
      });

      // Handle insight requests
      socket.on('get_insights', (userId: string) => {
        this.handleInsightRequest(socket, userId);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle user authentication
   */
  private handleAuthentication(socket: Socket, userId: string): void {
    this.userSockets.set(socket.id, { userId, socketId: socket.id });
    socket.join(`user:${userId}`);
    
    console.log(`User ${userId} authenticated on socket ${socket.id}`);
    
    // Send confirmation
    socket.emit('authenticated', {
      success: true,
      userId,
      socketId: socket.id,
    });

    // Send initial data
    this.sendInitialData(socket, userId);
  }

  /**
   * Handle activity tracking
   */
  private async handleActivityTracking(socket: Socket, data: {
    userId: string;
    type: string;
    element: string;
    page: string;
    duration?: number;
  }): Promise<void> {
    try {
      // Track activity in AI engine
      await aiService.trackActivity(data.userId, {
        type: data.type,
        element: data.element,
        page: data.page,
        duration: data.duration,
      });

      // Broadcast activity update to user's clients
      this.broadcastToUser(data.userId, 'activity_update', {
        type: data.type,
        element: data.element,
        page: data.page,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  /**
   * Handle prediction request
   */
  private async handlePredictionRequest(socket: Socket, userId: string): Promise<void> {
    try {
      const [layout, nextPage, analytics] = await Promise.all([
        aiService.getLayoutPrediction(userId),
        aiService.predictNextPage(userId),
        aiService.getAdaptiveAnalytics(userId),
      ]);

      socket.emit('prediction_update', {
        layout,
        nextPage,
        analytics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting predictions:', error);
    }
  }

  /**
   * Handle insight request
   */
  private async handleInsightRequest(socket: Socket, userId: string): Promise<void> {
    try {
      const insights = await aiService.generateInsights(userId);
      const productivity = await aiService.getProductivityInsights(userId);

      socket.emit('insight_update', {
        insights,
        productivity,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting insights:', error);
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket): void {
    const userSocket = this.userSockets.get(socket.id);
    if (userSocket) {
      console.log(`User ${userSocket.userId} disconnected`);
      this.userSockets.delete(socket.id);
    }
    console.log(`Client disconnected: ${socket.id}`);
  }

  /**
   * Send initial data to newly connected user
   */
  private async sendInitialData(socket: Socket, userId: string): Promise<void> {
    try {
      // Send predictions
      await this.handlePredictionRequest(socket, userId);

      // Send insights
      await this.handleInsightRequest(socket, userId);

      // Send system health
      const health = await aiService.getSystemHealth();
      socket.emit('system_health', health);
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  /**
   * Start activity simulation for demo
   */
  private startActivitySimulation(): void {
    if (this.activityInterval) return;

    this.activityInterval = setInterval(() => {
      // Simulate random activity for demo
      this.userSockets.forEach((userSocket) => {
        const activities = [
          { type: 'click', element: 'dashboard', page: '/dashboard' },
          { type: 'navigation', element: 'analytics', page: '/dashboard/analytics' },
          { type: 'click', element: 'notification', page: '/dashboard' },
          { type: 'scroll', element: 'feed', page: '/dashboard/activity' },
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        
        // Emit to specific user's room
        this.io?.to(`user:${userSocket.userId}`).emit('activity_update', {
          ...randomActivity,
          timestamp: new Date().toISOString(),
          simulated: true,
        });
      });

      // Broadcast system alerts periodically
      this.broadcastSystemAlerts();
    }, 30000); // Every 30 seconds
  }

  /**
   * Broadcast system alerts
   */
  private broadcastSystemAlerts(): void {
    // Check for anomalies
    aiService.checkAndHeal().then((results) => {
      if (results.anomalies_detected > 0) {
        this.io?.emit('system_alert', {
          type: 'anomaly_detected',
          severity: 'warning',
          message: `${results.anomalies_detected} anomalies detected`,
          details: results.anomalies,
          timestamp: new Date().toISOString(),
        });
      }
    }).catch(console.error);

    // Broadcast system health periodically
    aiService.getSystemHealth().then((health) => {
      this.io?.emit('system_health', health);
    }).catch(console.error);
  }

  /**
   * Broadcast to specific user
   */
  broadcastToUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.io?.emit(event, data);
  }

  /**
   * Get connected user count
   */
  getConnectedUsers(): number {
    return this.userSockets.size;
  }

  /**
   * Cleanup on shutdown
   */
  cleanup(): void {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.userSockets.clear();
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

