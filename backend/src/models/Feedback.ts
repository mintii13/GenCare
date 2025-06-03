import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  customer_id: mongoose.Types.ObjectId;
  booking_id: mongoose.Types.ObjectId;
  
  // Rating
  overall_rating: number; // 1-5 stars
  service_rating?: number;
  staff_rating?: number;
  facility_rating?: number;
  
  // Feedback
  comment?: string;
  suggestions?: string;
  
  // Response
  staff_response?: string;
  responded_by?: mongoose.Types.ObjectId;
  responded_at?: Date;
  
  createdAt: Date;
}

const FeedbackSchema: Schema = new Schema({
  customer_id: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  booking_id: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    unique: true,
    required: true
  },
  
  // Rating
  overall_rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number between 1 and 5'
    }
  },
  service_rating: {
    type: Number,
    min: 1,
    max: 5,
    validate: {
      validator: function(v: number) {
        return v === undefined || Number.isInteger(v);
      },
      message: 'Service rating must be a whole number between 1 and 5'
    }
  },
  staff_rating: {
    type: Number,
    min: 1,
    max: 5,
    validate: {
      validator: function(v: number) {
        return v === undefined || Number.isInteger(v);
      },
      message: 'Staff rating must be a whole number between 1 and 5'
    }
  },
  facility_rating: {
    type: Number,
    min: 1,
    max: 5,
    validate: {
      validator: function(v: number) {
        return v === undefined || Number.isInteger(v);
      },
      message: 'Facility rating must be a whole number between 1 and 5'
    }
  },
  
  // Feedback
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  suggestions: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Response
  staff_response: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  responded_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  responded_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'feedbacks'
});

// Indexes
FeedbackSchema.index({ customer_id: 1 });
FeedbackSchema.index({ booking_id: 1 });
FeedbackSchema.index({ overall_rating: 1 });
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ overall_rating: 1, createdAt: -1 });

// Virtual for populated customer
FeedbackSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated booking
FeedbackSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'booking_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated responder
FeedbackSchema.virtual('responder', {
  ref: 'User',
  localField: 'responded_by',
  foreignField: '_id',
  justOne: true
});

// Virtual for average detailed rating
FeedbackSchema.virtual('average_detailed_rating').get(function() {
  const ratings = [this.service_rating, this.staff_rating, this.facility_rating].filter(r => r !== undefined);
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 100) / 100;
});

// Static method to get average rating for all feedbacks
FeedbackSchema.statics.getAverageRating = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        averageOverall: { $avg: '$overall_rating' },
        averageService: { $avg: '$service_rating' },
        averageStaff: { $avg: '$staff_rating' },
        averageFacility: { $avg: '$facility_rating' },
        totalFeedbacks: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get rating distribution
FeedbackSchema.statics.getRatingDistribution = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$overall_rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to find recent feedbacks
FeedbackSchema.statics.findRecent = function(limit: number = 10) {
  return this.find()
    .populate('customer', 'customer_id')
    .populate('booking', 'booking_code type')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find by rating range
FeedbackSchema.statics.findByRatingRange = function(minRating: number, maxRating: number) {
  return this.find({
    overall_rating: { $gte: minRating, $lte: maxRating }
  })
  .populate('customer', 'customer_id')
  .populate('booking', 'booking_code type')
  .sort({ createdAt: -1 });
};

// Static method to find unresponded feedbacks
FeedbackSchema.statics.findUnresponded = function() {
  return this.find({
    staff_response: { $exists: false }
  })
  .populate('customer', 'customer_id')
  .populate('booking', 'booking_code type')
  .sort({ createdAt: 1 });
};

// Static method to find by customer
FeedbackSchema.statics.findByCustomer = function(customerId: string) {
  return this.find({ customer_id: customerId })
    .populate('booking', 'booking_code type scheduled_date')
    .sort({ createdAt: -1 });
};

// Method to respond to feedback
FeedbackSchema.methods.respond = function(responseText: string, responderId: string) {
  this.staff_response = responseText;
  this.responded_by = responderId;
  this.responded_at = new Date();
  return this.save();
};

// Method to check if feedback has been responded
FeedbackSchema.methods.hasResponse = function() {
  return Boolean(this.staff_response && this.responded_by && this.responded_at);
};

// Ensure virtual fields are serialized
FeedbackSchema.set('toJSON', { virtuals: true });
FeedbackSchema.set('toObject', { virtuals: true });

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema); 