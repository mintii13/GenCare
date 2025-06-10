import mongoose, { Schema, Document } from 'mongoose';

export interface IStiPackage extends Document {
    sti_package_name: string;
    sti_package_code: string;
    price: number;
    description: string;
    duration: Date; // thời gian nhận kết quả (theo ngày)
    preparation_instructions?: string;
    target_group: string;
    is_active: boolean;
    createdBy: mongoose.Types.ObjectId;
}

const stiPackageSchema: Schema<IStiPackage> = new Schema({
    sti_package_name: {type: String, required: true, trim: true},
    sti_package_code: {type: String, required: true, unique: true, uppercase: true, trim: true},
    price: { type: Number, required: true, min: 0},
    description: {type: String, required: true, trim: true},
    duration: {type: Date, required: true,
    validate: {
        validator: function (value: Date) {
            return value > new Date();
        },
        message: 'date_of_result must be a future date.',
    }},
    preparation_instructions: {type: String, trim: true},
    target_group: {type: String, require: true, trim: true},
    is_active: {type: Boolean, default: true},
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }

  }
);

export const StiPackage = mongoose.model<IStiPackage>('STIPackage', stiPackageSchema, 'stipackages');
