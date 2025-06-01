import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
    admin_id: string;
    user_id: string;
    system_permissions: string[];
}

export class Admin {
    private static schema = new Schema<IAdmin>({
        admin_id: { type: String, required: true, unique: true },
        user_id: { type: String, required: true, ref: 'User' },
        system_permissions: [{ type: String }]
    });

    public static model = mongoose.model<IAdmin>('Admin', Admin.schema);
}