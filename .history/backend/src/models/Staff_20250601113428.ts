import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
    staff_id: string;
    user_id: string;
    manager_id?: string;
    department: string;
    hire_date: Date;
    permissions: string[];
}

const staffSchema = new Schema<IStaff>({
    staff_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, ref: 'User' },
    manager_id: { type: String, ref: 'Staff' },
    department: { type: String, required: true },
    hire_date: { type: Date, required: true },
    permissions: [{ type: String }]
}, {
    timestamps: true
});

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);