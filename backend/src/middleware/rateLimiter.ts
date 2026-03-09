import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 100, // Higher limit in development
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip rate limiting in development
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 50, // Higher limit in development
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip rate limiting in development
});

// Stricter limiter for write operations
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 100 : 30, // Higher limit in development
  message: {
    success: false,
    error: {
      code: 'WRITE_RATE_LIMIT_EXCEEDED',
      message: 'Too many write requests, please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip rate limiting in development
});

// WebSocket connection limiter
export const socketLimiter = (maxConnections: number = 10) => {
  const connections = new Map<string, number>();

  return {
    check: (userId: string): boolean => {
      const current = connections.get(userId) || 0;
      if (current >= maxConnections) {
        return false;
      }
      connections.set(userId, current + 1);
      return true;
    },
    remove: (userId: string): void => {
      const current = connections.get(userId) || 0;
      if (current > 0) {
        connections.set(userId, current - 1);
      }
    },
    getCount: (userId: string): number => {
      return connections.get(userId) || 0;
    },
  };
};

// Request size limiter
export const requestSizeLimiter = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload too large.',
        },
      });
      return;
    }
    next();
  };
};

// Helper function to parse size string
function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  if (!match) {
    return 10 * 1024 * 1024; // default 10MB
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] as keyof typeof units;
  
  return value * (units[unit] || 1);
}

// CSRF token middleware (simplified for API)
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // For APIs, we use token-based auth, so CSRF is less critical
  // This is a placeholder for additional security measures
  next();
};

// Input sanitization middleware
export const inputSanitizer = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as Request['query'];
  }
  
  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}

function sanitizeString(str: string): string {
  // Remove potential XSS vectors
  return str
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // HSTS (only enable in production with proper SSL)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

// IP blacklist/whitelist (simple implementation)
const blacklist: Set<string> = new Set();
const whitelist: Set<string> = new Set();

export const ipFilter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // If whitelist is enabled and IP is not in whitelist, block
  if (whitelist.size > 0 && !whitelist.has(ip)) {
    res.status(403).json({
      success: false,
      error: {
        code: 'IP_BLOCKED',
        message: 'Your IP is not authorized to access this resource.',
      },
    });
    return;
  }
  
  // If IP is blacklisted, block
  if (blacklist.has(ip)) {
    res.status(403).json({
      success: false,
      error: {
        code: 'IP_BLOCKED',
        message: 'Your IP has been blocked.',
      },
    });
    return;
  }
  
  next();
};

// Add IP to blacklist (admin function)
export const addToBlacklist = (ip: string): void => {
  blacklist.add(ip);
};

// Remove IP from blacklist (admin function)
export const removeFromBlacklist = (ip: string): void => {
  blacklist.delete(ip);
};

// Add IP to whitelist (admin function)
export const addToWhitelist = (ip: string): void => {
  whitelist.add(ip);
};

// Remove IP from whitelist (admin function)
export const removeFromWhitelist = (ip: string): void => {
  whitelist.delete(ip);
};

