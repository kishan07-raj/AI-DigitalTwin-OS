import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledReport extends Document {
  userId: mongoose.Types.ObjectId;
  reportType: 'daily' | 'weekly' | 'monthly';
  scheduleTime: string; // Cron format: "0 9 * * *" = daily at 9am
  timezone: string;
  lastGenerated?: Date;
  nextRun: Date;
  isActive: boolean;
  emailNotification: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledReportSchema = new Schema<IScheduledReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    scheduleTime: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    lastGenerated: {
      type: Date,
    },
    nextRun: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailNotification: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
scheduledReportSchema.index({ userId: 1, isActive: 1 });
scheduledReportSchema.index({ nextRun: 1, isActive: 1 });

export const ScheduledReport = mongoose.model<IScheduledReport>('ScheduledReport', scheduledReportSchema);

