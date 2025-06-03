import mongoose, { Document, Schema } from 'mongoose';

export interface IPackageTest extends Document {
  package_id: mongoose.Types.ObjectId;
  test_id: mongoose.Types.ObjectId;
  is_mandatory: boolean;
}

const PackageTestSchema: Schema = new Schema({
  package_id: {
    type: Schema.Types.ObjectId,
    ref: 'TestPackage',
    required: true
  },
  test_id: {
    type: Schema.Types.ObjectId,
    ref: 'TestType',
    required: true
  },
  is_mandatory: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: false,
  collection: 'package_tests'
});

// Compound primary key
PackageTestSchema.index({ package_id: 1, test_id: 1 }, { unique: true });

// Additional indexes for faster queries
PackageTestSchema.index({ package_id: 1 });
PackageTestSchema.index({ test_id: 1 });

// Virtual to get package details
PackageTestSchema.virtual('package', {
  ref: 'TestPackage',
  localField: 'package_id',
  foreignField: '_id',
  justOne: true
});

// Virtual to get test details
PackageTestSchema.virtual('test', {
  ref: 'TestType',
  localField: 'test_id',
  foreignField: '_id',
  justOne: true
});

// Static method to find tests in a package
PackageTestSchema.statics.findTestsInPackage = function(packageId: string) {
  return this.find({ package_id: packageId })
    .populate('test')
    .sort({ is_mandatory: -1, 'test.name': 1 });
};

// Static method to find packages containing a test
PackageTestSchema.statics.findPackagesWithTest = function(testId: string) {
  return this.find({ test_id: testId })
    .populate('package')
    .sort({ 'package.name': 1 });
};

// Static method to get mandatory tests in a package
PackageTestSchema.statics.findMandatoryTestsInPackage = function(packageId: string) {
  return this.find({ package_id: packageId, is_mandatory: true })
    .populate('test')
    .sort({ 'test.name': 1 });
};

// Ensure virtual fields are serialized
PackageTestSchema.set('toJSON', { virtuals: true });
PackageTestSchema.set('toObject', { virtuals: true });

export default mongoose.model<IPackageTest>('PackageTest', PackageTestSchema); 