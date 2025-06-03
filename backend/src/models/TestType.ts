import mongoose, { Document, Schema } from 'mongoose';

export interface ITestType extends Document {
  code: string;
  name: string;
  name_vi: string;
  description?: string;
  
  // Pricing
  price: number;
  
  // Test Information
  category: 'bacterial' | 'viral' | 'parasitic' | 'other';
  sample_types: string[]; // JSON array: blood, urine, swab
  turnaround_hours: number;
  
  // Status
  is_active: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const TestTypeSchema: Schema = new Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
    // e.g., HIV, SYPH, CHLA
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  name_vi: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Test Information
  category: {
    type: String,
    enum: ['bacterial', 'viral', 'parasitic', 'other'],
    required: true
  },
  sample_types: [{
    type: String,
    enum: ['blood', 'urine', 'swab', 'saliva', 'throat', 'genital'],
    required: true
  }],
  turnaround_hours: {
    type: Number,
    default: 48,
    min: 1
  },
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'test_types'
});

// Indexes
TestTypeSchema.index({ code: 1 });
TestTypeSchema.index({ category: 1 });
TestTypeSchema.index({ is_active: 1 });
TestTypeSchema.index({ name: 'text', name_vi: 'text' }); // Text search

// Static method to find active tests
TestTypeSchema.statics.findActive = function() {
  return this.find({ is_active: true }).sort({ name: 1 });
};

// Static method to find by category
TestTypeSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, is_active: true }).sort({ name: 1 });
};

export default mongoose.model<ITestType>('TestType', TestTypeSchema);
