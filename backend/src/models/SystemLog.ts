import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemLog extends Document {
  level: 'info' | 'warn' | 'error' | 'debug' | 'critical';
  source: 'backend' | 'frontend' | 'ai_engine' | 'system' | 'security';
  message: string;
  metadata?: Record<string, any>;
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

const systemLogSchema = new Schema<ISystemLog>(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug', 'critical'],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['backend', 'frontend', 'ai_engine', 'system', 'security'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: String,
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolvedBy: String,
  },
  {
    timestamps: false,
  }
);

// Indexes for efficient querying
systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ source: 1, timestamp: -1 });
systemLogSchema.index({ userId: 1, timestamp: -1 });
systemLogSchema.index({ resolved: 1, timestamp: -1 });

export const SystemLog = mongoose.model<ISystemLog>('SystemLog', systemLogSchema);

