import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  device: {
    browser?: string;
    os?: string;
    deviceType?: string;
    ip?: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
  startedAt: Date;
  lastActive: Date;
  endedAt?: Date;
  duration?: number;
  pageViews: number;
  events: number;
  status: 'active' | 'ended' | 'expired';
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    device: {
      browser: String,
      os: String,
      deviceType: String,
      ip: String,
    },
    location: {
      country: String,
      city: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    duration: Number,
    pageViews: {
      type: Number,
      default: 0,
    },
    events: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'expired'],
      default: 'active',
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
sessionSchema.index({ userId: 1, startedAt: -1 });
sessionSchema.index({ status: 1, lastActive: -1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);

