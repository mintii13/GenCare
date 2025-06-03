import mongoose, { Document, Schema } from 'mongoose';

export interface ITestResult extends Document {
  booking_id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId;
  
  // Sample Information
  sample_collected_date?: Date;
  sample_collected_by?: mongoose.Types.ObjectId;
  
  // Results
  results: any[]; // JSON array of test results
  /*
  Example:
  [{
    "test_id": "...",
    "test_name": "HIV",
    "result": "negative",
    "value": "0.15",
    "reference_range": "< 1.0",
    "notes": "..."
  }]
  */
  
  // Verification
  verified_by?: mongoose.Types.ObjectId;
  verified_at?: Date;
  
  // Report
  report_url?: string;
  report_generated_at?: Date;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'need_retest';
  
  createdAt: Date;
  updatedAt: Date;
}

const TestResultSchema: Schema = new Schema({
  booking_id: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    unique: true,
    required: true
  },
  customer_id: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  
  // Sample Information
  sample_collected_date: {
    type: Date
  },
  sample_collected_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Results
  results: [{
    test_id: {
      type: String,
      required: true
    },
    test_name: {
      type: String,
      required: true
    },
    result: {
      type: String,
      enum: ['positive', 'negative', 'indeterminate', 'invalid'],
      required: true
    },
    value: {
      type: String
    },
    reference_range: {
      type: String
    },
    notes: {
      type: String,
      trim: true
    },
    test_date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Verification
  verified_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verified_at: {
    type: Date
  },
  
  // Report
  report_url: {
    type: String,
    trim: true
  },
  report_generated_at: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'need_retest'],
    default: 'pending'
  }
}, {
  timestamps: true,
  collection: 'test_results'
});

// Indexes
TestResultSchema.index({ booking_id: 1 });
TestResultSchema.index({ customer_id: 1 });
TestResultSchema.index({ status: 1 });
TestResultSchema.index({ verified_at: 1 });
TestResultSchema.index({ createdAt: -1 });

// Virtual for populated booking
TestResultSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'booking_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated customer
TestResultSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated sample collector
TestResultSchema.virtual('sample_collector', {
  ref: 'User',
  localField: 'sample_collected_by',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated verifier
TestResultSchema.virtual('verifier', {
  ref: 'User',
  localField: 'verified_by',
  foreignField: '_id',
  justOne: true
});

// Static method to find results by customer
TestResultSchema.statics.findByCustomer = function(customerId: string) {
  return this.find({ customer_id: customerId })
    .populate('booking')
    .sort({ createdAt: -1 });
};

// Static method to find pending verification
TestResultSchema.statics.findPendingVerification = function() {
  return this.find({ 
    status: { $in: ['processing', 'completed'] },
    verified_by: { $exists: false }
  }).sort({ createdAt: 1 });
};

// Method to check if all results are negative
TestResultSchema.methods.isAllNegative = function() {
  return this.results.every((result: any) => result.result === 'negative');
};

// Method to check if any result is positive
TestResultSchema.methods.hasPositiveResult = function() {
  return this.results.some((result: any) => result.result === 'positive');
};

// Method to get positive results only
TestResultSchema.methods.getPositiveResults = function() {
  return this.results.filter((result: any) => result.result === 'positive');
};

// Ensure virtual fields are serialized
TestResultSchema.set('toJSON', { virtuals: true });
TestResultSchema.set('toObject', { virtuals: true });

export default mongoose.model<ITestResult>('TestResult', TestResultSchema); 