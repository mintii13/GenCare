import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    full_name: string;
    phone?: string;
    date_of_birth?: Date;
    gender?: string;
    registration_date: Date;
    updated_date: Date;
    last_login?: Date;
    status: boolean;
    email_verified: boolean;
    role: 'customer' | 'consultant' | 'staff' | 'admin';
    avatar?: string;
    googleId?: string;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    full_name: { type: String, required: true },
    phone: { type: String },
    date_of_birth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    registration_date: { type: Date, default: Date.now },
    updated_date: { type: Date, default: Date.now },
    last_login: { type: Date },
    status: { type: Boolean, default: true },
    email_verified: { type: Boolean, default: false },
    role: { type: String, enum: ['customer', 'consultant', 'staff', 'admin'], required: true },
    avatar: { type: String },
    googleId: { type: String }
});

export const User = mongoose.model<IUser>('User', userSchema);