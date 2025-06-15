import mongoose, { Schema, Document } from 'mongoose';

export interface IStiPackageTest extends Document {
    sti_package_id: mongoose.Types.ObjectId;
    sti_test_id: mongoose.Types.ObjectId;
    is_active: boolean;
}

const stiPackageTestSchema = new Schema<IStiPackageTest>({
    sti_package_id: { type: Schema.Types.ObjectId, ref: 'STIPackage', required: true },
    sti_test_id: { type: Schema.Types.ObjectId, ref: 'StiTest', required: true },
    is_active: { type: Boolean, default: true }
});

export const StiPackageTest = mongoose.model<IStiPackageTest>('StiPackageTest', stiPackageTestSchema);
