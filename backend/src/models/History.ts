import mongoose, { Document, Schema } from 'mongoose';

export interface IHistory extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'activity' | 'prediction' | 'report' | 'twin_analysis';
  action: string;
  description: string;
  data: Record<string, any>;
  metadata?: {
    duration?: number;
    score?: number;
    confidence?: number;
  };
  createdAt: Date;
}

const historySchema = new Schema<IHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['activity', 'prediction', 'report', 'twin_analysis'],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      duration: Number,
      score: Number,
      confidence: Number,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient querying
historySchema.index({ userId: 1, type: 1, createdAt: -1 });
historySchema.index({ userId: 1, createdAt: -1 });

export const History = mongoose.model<IHistory>('History', historySchema);

