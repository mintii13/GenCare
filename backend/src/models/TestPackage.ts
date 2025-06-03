import mongoose, { Document, Schema } from 'mongoose';

export interface ITestPackage extends Document {
  code: string;
  name: string;
  name_vi: string;
  description?: string;
  
  // Pricing
  price: number;
  original_price?: number;
  discount_percent: number;
  
  // Features
  includes_consultation: boolean;
  includes_home_collection: boolean;
  priority_results: boolean;
  
  // Marketing
  is_popular: boolean;
  is_featured: boolean;
  tags?: string[]; // JSON array of tags
  
  // Status
  is_active: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const TestPackageSchema: Schema = new Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
    // e.g., BASIC, STANDARD, PREMIUM
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
  original_price: {
    type: Number,
    min: 0
  },
  discount_percent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Features
  includes_consultation: {
    type: Boolean,
    default: false
  },
  includes_home_collection: {
    type: Boolean,
    default: false
  },
  priority_results: {
    type: Boolean,
    default: false
  },
  
  // Marketing
  is_popular: {
    type: Boolean,
    default: false
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'test_packages'
});

// Indexes
TestPackageSchema.index({ code: 1 });
TestPackageSchema.index({ is_active: 1 });
TestPackageSchema.index({ is_popular: 1 });
TestPackageSchema.index({ is_featured: 1 });
TestPackageSchema.index({ name: 'text', name_vi: 'text' }); // Text search

// Virtual to get tests in this package
TestPackageSchema.virtual('tests', {
  ref: 'PackageTest',
  localField: '_id',
  foreignField: 'package_id'
});

// Static method to find active packages
TestPackageSchema.statics.findActive = function() {
  return this.find({ is_active: true }).sort({ name: 1 });
};

// Static method to find popular packages
TestPackageSchema.statics.findPopular = function() {
  return this.find({ is_active: true, is_popular: true }).sort({ name: 1 });
};

// Static method to find featured packages
TestPackageSchema.statics.findFeatured = function() {
  return this.find({ is_active: true, is_featured: true }).sort({ name: 1 });
};

// Method to calculate discounted price
TestPackageSchema.methods.getDiscountedPrice = function() {
  if (this.original_price && this.discount_percent > 0) {
    return this.original_price * (1 - this.discount_percent / 100);
  }
  return this.price;
};

// Ensure virtual fields are serialized
TestPackageSchema.set('toJSON', { virtuals: true });
TestPackageSchema.set('toObject', { virtuals: true });

export default mongoose.model<ITestPackage>('TestPackage', TestPackageSchema); 