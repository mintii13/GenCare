import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    user_id: mongoose.Types.ObjectId;
    medical_history?: string;
    last_updated: Date;
}

const customerSchema = new Schema<ICustomer>({
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    medical_history: { type: String },
    last_updated: { type: Date, default: Date.now }
});

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);