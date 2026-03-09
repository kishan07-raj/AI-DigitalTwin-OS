import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'alert' | 'productivity' | 'behavior' | 'system' | 'recommendation' | 'AI_insight' | 'system_alert';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['info', 'warning', 'success', 'error', 'alert', 'productivity', 'behavior', 'system', 'recommendation', 'AI_insight', 'system_alert'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed },
}, { timestamps: true });

// Index for faster queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

