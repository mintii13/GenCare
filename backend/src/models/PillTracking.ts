import mongoose, { Schema, Document } from 'mongoose';

export type PillTypes = '21+7'| '28-day';
export interface IPillTracking extends Document {
    user_id: mongoose.Types.ObjectId;
    pill_start_date: Date;
    is_taken: boolean;
    taken_time?: Date;
    pill_number: number;
    pill_type: PillTypes;
    pill_status: 'active' | 'placebo';
    reminder_enabled: boolean;
    reminder_time: string; // 'HH:mm' format
    reminder_sent: boolean;
    is_active: boolean;
    createdAt: Date;
}

const PillTrackingSchema: Schema = new Schema<IPillTracking>({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pill_start_date: { type: Date, required: true },
    is_taken: { type: Boolean, default: false },
    taken_time: { type: Date, default: null },
    pill_number: { type: Number, required: true },
    pill_type: { type: String, enum: ['21+7', '28-day'], required: true },
    pill_status: { type: String, enum: ['active', 'placebo'], required: true },
    reminder_enabled: { type: Boolean, default: true },
    reminder_time: { type: String, required: true },
    reminder_sent: { type: Boolean, default: false },
    is_active: {type: Boolean, default: true}
}, {
    timestamps: { createdAt: true, updatedAt: false}
});

export const PillTracking = mongoose.model<IPillTracking>('PillTracking', PillTrackingSchema);
