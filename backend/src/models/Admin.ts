// src/models/Admin.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
    admin_id: string;
    user_id: string;
    system_permissions: string[];
}

const adminSchema = new Schema<IAdmin>({
    admin_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, ref: 'User' },
    system_permissions: [{ type: String }]
}, {
    timestamps: true
});

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);