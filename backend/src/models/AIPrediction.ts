import mongoose, { Document, Schema } from 'mongoose';

export interface IAIPrediction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'ui_layout' | 'user_behavior' | 'task_automation' | 'anomaly' | 'suggestion';
  modelName: string;
  prediction: Record<string, any>;
  confidence: number;
  features: string[];
  feedback?: 'positive' | 'negative' | 'neutral';
  createdAt: Date;
  used: boolean;
  usedAt?: Date;
}

const aiPredictionSchema = new Schema<IAIPrediction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['ui_layout', 'user_behavior', 'task_automation', 'anomaly', 'suggestion'],
      required: true,
    },
    modelName: {
      type: String,
      required: true,
    },
    prediction: {
      type: Schema.Types.Mixed,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    features: [{
      type: String,
    }],
    feedback: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: Date,
  },
  {
    timestamps: false,
  }
);

// Indexes
aiPredictionSchema.index({ userId: 1, type: 1, createdAt: -1 });
aiPredictionSchema.index({ type: 1, createdAt: -1 });
aiPredictionSchema.index({ feedback: 1, createdAt: -1 });

export const AIPrediction = mongoose.model<IAIPrediction>('AIPrediction', aiPredictionSchema);

