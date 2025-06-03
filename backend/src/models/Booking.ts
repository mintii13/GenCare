import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  booking_code: string;
  customer_id: mongoose.Types.ObjectId;
  
  // Booking Type & Details
  type: 'consultation' | 'testing';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  
  // Scheduling
  scheduled_date: Date;
  time_slot: string; // Format: HH:MM
  duration: number; // minutes
  
  // References
  source_sti_test_id?: mongoose.Types.ObjectId;
  package_id?: mongoose.Types.ObjectId;
  facility_id?: mongoose.Types.ObjectId;
  assigned_staff_id?: mongoose.Types.ObjectId;
  
  // Test Selection (for testing type)
  test_ids?: string[]; // JSON array of test IDs
  
  // Consultation Details (for consultation type)
  consultation_mode?: 'online' | 'in-person';
  room_url?: string;
  consultation_notes?: string;
  prescription?: string;
  
  // Contact Information
  contact_phone: string;
  contact_email: string;
  notes?: string;
  
  // Payment
  payment_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_method?: 'cash' | 'card' | 'transfer';
  transaction_id?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmed_at?: Date;
  completed_at?: Date;
  cancelled_at?: Date;
}

const BookingSchema: Schema = new Schema({
  booking_code: {
    type: String,
    unique: true,
    required: true
    // Auto: BOOK-2025-000001
  },
  customer_id: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  
  // Booking Type & Details
  type: {
    type: String,
    enum: ['consultation', 'testing'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Scheduling
  scheduled_date: {
    type: Date,
    required: true
  },
  time_slot: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  duration: {
    type: Number,
    default: 30,
    min: 15,
    max: 180 // minutes
  },
  
  // References
  source_sti_test_id: {
    type: Schema.Types.ObjectId,
    ref: 'STITest'
  },
  package_id: {
    type: Schema.Types.ObjectId,
    ref: 'TestPackage'
  },
  facility_id: {
    type: Schema.Types.ObjectId,
    ref: 'MedicalFacility'
  },
  assigned_staff_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Test Selection (for testing type)
  test_ids: [{
    type: String
  }],
  
  // Consultation Details (for consultation type)
  consultation_mode: {
    type: String,
    enum: ['online', 'in-person']
  },
  room_url: {
    type: String,
    trim: true
  },
  consultation_notes: {
    type: String,
    trim: true
  },
  prescription: {
    type: String,
    trim: true
  },
  
  // Contact Information
  contact_phone: {
    type: String,
    required: true,
    trim: true
  },
  contact_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Payment
  payment_amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'transfer']
  },
  transaction_id: {
    type: String,
    trim: true
  },
  
  // Timestamps
  confirmed_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  cancelled_at: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'bookings'
});

// Indexes
BookingSchema.index({ booking_code: 1 });
BookingSchema.index({ customer_id: 1 });
BookingSchema.index({ scheduled_date: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ type: 1 });
BookingSchema.index({ facility_id: 1, scheduled_date: 1 });

// Auto-generate booking_code before saving
BookingSchema.pre('save', async function(next) {
  if (!this.booking_code) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Booking').countDocuments();
    this.booking_code = `BOOK-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for populated customer
BookingSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated facility
BookingSchema.virtual('facility', {
  ref: 'MedicalFacility',
  localField: 'facility_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated package
BookingSchema.virtual('package', {
  ref: 'TestPackage',
  localField: 'package_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated assigned staff
BookingSchema.virtual('assigned_staff', {
  ref: 'User',
  localField: 'assigned_staff_id',
  foreignField: '_id',
  justOne: true
});

// Static method to find upcoming bookings
BookingSchema.statics.findUpcoming = function(customerId?: string) {
  const query: any = {
    scheduled_date: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  };
  if (customerId) query.customer_id = customerId;
  return this.find(query).sort({ scheduled_date: 1 });
};

// Method to check if booking can be cancelled
BookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingTime = new Date(this.scheduled_date);
  const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return this.status === 'pending' || (this.status === 'confirmed' && hoursUntilBooking >= 24);
};

// Ensure virtual fields are serialized
BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.set('toObject', { virtuals: true });

export default mongoose.model<IBooking>('Booking', BookingSchema); 