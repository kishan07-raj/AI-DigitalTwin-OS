import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDatabase } from './utils/database';
import routes from './routes';
import { socketService } from './services/socketService';
import { aiService } from './services/aiService';
import { apiLimiter, authLimiter, securityHeaders, inputSanitizer } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security headers
app.use(securityHeaders);

// Input sanitization
app.use(inputSanitizer);

// Rate limiting
app.use('/api', apiLimiter);

// Request logging
app.use(requestLogger);

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'AI-DigitalTwin-OS API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health',
    services: {
      backend: 'running',
      websocket: 'available',
      aiEngine: 'integrated'
    },
    security: {
      rateLimited: true,
      cors: 'enabled',
      helmet: 'enabled'
    }
  });
});

// Health check with AI engine status
app.get('/health', async (req: Request, res: Response) => {
  const aiEngineAvailable = await aiService.healthCheck();
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'healthy',
      websocket: 'healthy',
      aiEngine: aiEngineAvailable ? 'healthy' : 'unavailable (using mock data)'
    },
    security: {
      rateLimited: true,
      cors: 'enabled'
    }
  });
});

// Error handling - 404 handler (must be before error handler)
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// Start server with database and Socket.io
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Initialize Socket.io
    socketService.initialize(httpServer);
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket available at http://localhost:${PORT}`);
      console.log(`🤖 AI Engine service integrated`);
      console.log(`🛡️ Security: Rate limiting, CORS, Helmet enabled`);
      console.log(`📝 Request logging enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  socketService.cleanup();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  socketService.cleanup();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

export default app;

