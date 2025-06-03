// src/models/Admin.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
    admin_id: string;
    user_id: mongoose.Types.ObjectId;
    system_permissions: string[];
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
    admin_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    system_permissions: [{
        type: String,
        enum: [
            'user_management',
            'content_management',
            'system_settings',
            'analytics_access',
            'facility_management',
            'staff_management',
            'test_management',
            'billing_access'
        ]
    }]
}, {
    timestamps: true,
    collection: 'admins'
});

// Indexes
AdminSchema.index({ admin_id: 1 });
AdminSchema.index({ user_id: 1 });

// Virtual for populated user
AdminSchema.virtual('user', {
    ref: 'User',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true
});

// Ensure virtual fields are serialized
AdminSchema.set('toJSON', { virtuals: true });
AdminSchema.set('toObject', { virtuals: true });

export default mongoose.model<IAdmin>('Admin', AdminSchema);