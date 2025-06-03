import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  
  // Notification Content
  type: 'booking_reminder' | 'test_result' | 'medication_reminder' | 'cycle_tracking';
  title: string;
  message: string;
  
  // Delivery
  channel: 'email' | 'sms' | 'push' | 'in_app';
  
  // Status
  is_read: boolean;
  sent_at?: Date;
  read_at?: Date;
  
  // References
  related_entity_type?: string;
  related_entity_id?: string;
  
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification Content
  type: {
    type: String,
    enum: ['booking_reminder', 'test_result', 'medication_reminder', 'cycle_tracking'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Delivery
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'in_app'],
    required: true
  },
  
  // Status
  is_read: {
    type: Boolean,
    default: false
  },
  sent_at: {
    type: Date
  },
  read_at: {
    type: Date
  },
  
  // References
  related_entity_type: {
    type: String,
    trim: true
  },
  related_entity_id: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'notifications'
});

// Indexes
NotificationSchema.index({ user_id: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ is_read: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ user_id: 1, is_read: 1, createdAt: -1 });

// Virtual for populated user
NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Static method to find unread notifications for user
NotificationSchema.statics.findUnreadByUser = function(userId: string) {
  return this.find({ user_id: userId, is_read: false })
    .sort({ createdAt: -1 });
};

// Static method to find recent notifications for user
NotificationSchema.statics.findRecentByUser = function(userId: string, limit: number = 20) {
  return this.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ user_id: userId, is_read: false });
};

// Static method to mark all as read for user
NotificationSchema.statics.markAllAsReadByUser = function(userId: string) {
  return this.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true, read_at: new Date() }
  );
};

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.is_read = true;
  this.read_at = new Date();
  return this.save();
};

// Method to mark as sent
NotificationSchema.methods.markAsSent = function() {
  this.sent_at = new Date();
  return this.save();
};

// Static method to create booking reminder
NotificationSchema.statics.createBookingReminder = function(userId: string, bookingId: string, bookingDate: Date) {
  return this.create({
    user_id: userId,
    type: 'booking_reminder',
    title: 'Reminder: Upcoming Appointment',
    message: `You have an appointment scheduled for ${bookingDate.toLocaleDateString()}. Please arrive 15 minutes early.`,
    channel: 'in_app',
    related_entity_type: 'Booking',
    related_entity_id: bookingId
  });
};

// Static method to create test result notification
NotificationSchema.statics.createTestResultNotification = function(userId: string, testResultId: string) {
  return this.create({
    user_id: userId,
    type: 'test_result',
    title: 'Test Results Available',
    message: 'Your test results are now available. Please check your dashboard to view them.',
    channel: 'in_app',
    related_entity_type: 'TestResult',
    related_entity_id: testResultId
  });
};

// Ensure virtual fields are serialized
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

export default mongoose.model<INotification>('Notification', NotificationSchema); 