import { z } from 'zod';

// Auth Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'adaptive']).optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
    adaptiveUI: z.boolean().optional(),
  }).optional(),
});

// Activity Validation Schemas
export const trackActivitySchema = z.object({
  type: z.enum(['page_view', 'click', 'keyboard', 'mouse', 'scroll', 'idle', 'focus', 'blur']),
  data: z.record(z.any()).optional(),
  duration: z.number().optional(),
  page: z.string().optional(),
  sessionId: z.string().optional(),
});

export const createSessionSchema = z.object({
  startTime: z.string().datetime().optional(),
  device: z.string().optional(),
  platform: z.string().optional(),
});

// Prediction Validation Schemas
export const feedbackSchema = z.object({
  predictionId: z.string(),
  feedback: z.enum(['positive', 'negative', 'neutral']),
});

// Report Validation Schemas
export const generateReportSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Notification Validation Schemas
export const createNotificationSchema = z.object({
  type: z.enum(['info', 'success', 'warning', 'error', 'insight']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  data: z.record(z.any()).optional(),
});

// Team Validation Schemas
export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().optional(),
});

export const addTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
});

// Validation Middleware Factory
import { Request, Response, NextFunction } from 'express';

export const validate = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
        return;
      }
      next(error);
    }
  };
};

// Query Parameter Validation
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive().optional()),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).optional()),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const parseQueryParams = <T>(schema: z.ZodSchema<T>, query: Record<string, any>): T => {
  return schema.parse(query);
};

