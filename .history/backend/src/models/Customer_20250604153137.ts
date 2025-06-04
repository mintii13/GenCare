import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    customer_id: string;
    user_id: string;
    medical_history?: string;
    last_updated: Date;
}

const customerSchema = new Schema<ICustomer>({
    customer_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, ref: 'User' },
    medical_history: { type: String },
    last_updated: { type: Date, default: Date.now }
});

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
