import mongoose, { Document, Schema } from 'mongoose';

export interface ISTITest extends Document {
  user_id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId;
  
  // Symptom Information
  symptoms: string[]; // JSON array of symptoms
  symptom_details: any; // JSON object with detailed symptoms
  duration?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  
  // Risk Factors
  recent_risks?: string[]; // JSON array
  sex_types?: string[]; // JSON array
  past_stis?: string[]; // JSON array
  last_test_date?: Date;
  
  // Test Purpose
  purpose?: 'routine' | 'symptomatic' | 'exposure' | 'pregnancy';
  urgency?: 'routine' | 'urgent' | 'emergency';
  budget?: 'economy' | 'standard' | 'premium';
  
  // AI Analysis Results
  risk_score?: number;
  risk_level?: 'low' | 'medium' | 'high';
  ai_recommendations?: any; // JSON object with AI results
  
  createdAt: Date;
}

const STITestSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer_id: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  
  // Symptom Information
  symptoms: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0;
      },
      message: 'At least one symptom is required'
    }
  },
  symptom_details: {
    type: Schema.Types.Mixed, // JSON object
    default: {}
  },
  duration: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe']
  },
  
  // Risk Factors
  recent_risks: [{
    type: String,
    trim: true
  }],
  sex_types: [{
    type: String,
    trim: true
  }],
  past_stis: [{
    type: String,
    trim: true
  }],
  last_test_date: {
    type: Date
  },
  
  // Test Purpose
  purpose: {
    type: String,
    enum: ['routine', 'symptomatic', 'exposure', 'pregnancy']
  },
  urgency: {
    type: String,
    enum: ['routine', 'urgent', 'emergency']
  },
  budget: {
    type: String,
    enum: ['economy', 'standard', 'premium']
  },
  
  // AI Analysis Results
  risk_score: {
    type: Number,
    min: 0,
    max: 100
  },
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  ai_recommendations: {
    type: Schema.Types.Mixed, // JSON object
    default: {}
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'sti_tests'
});

// Indexes
STITestSchema.index({ user_id: 1 });
STITestSchema.index({ customer_id: 1 });
STITestSchema.index({ createdAt: -1 });
STITestSchema.index({ risk_level: 1 });

// Virtual for populated user
STITestSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated customer
STITestSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
STITestSchema.set('toJSON', { virtuals: true });
STITestSchema.set('toObject', { virtuals: true });

export default mongoose.model<ISTITest>('STITest', STITestSchema); 