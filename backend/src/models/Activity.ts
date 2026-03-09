import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'click' | 'navigation' | 'typing' | 'session' | 'feature_use' | 'search';
  action: string;
  element?: string;
  page?: string;
  duration?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  sessionId: string;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['click', 'navigation', 'typing', 'session', 'feature_use', 'search'],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    element: {
      type: String,
    },
    page: {
      type: String,
    },
    duration: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient querying
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ sessionId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, type: 1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);

