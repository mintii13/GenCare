import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
    user_id: mongoose.Types.ObjectId;
    manager_id?: mongoose.Types.ObjectId;
    department: string;
    hire_date: Date;
    permissions: string[];
}

const staffSchema = new Schema<IStaff>({
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    manager_id: { type: Schema.Types.ObjectId, ref: 'Staff' },
    department: { type: String, required: true },
    hire_date: { type: Date, required: true },
    permissions: [{ type: String }]
}, {
    timestamps: true
});

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);