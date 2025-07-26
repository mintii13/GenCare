import mongoose, { Schema, Document } from 'mongoose';

export type PillTypes = '21-day'| '24+4' | '21+7';
export interface IPillTracking extends Document {
    user_id: mongoose.Types.ObjectId;
    menstrual_cycle_id: mongoose.Types.ObjectId;
    pill_start_date: Date;
    is_taken: boolean;
    pill_number: number;
    pill_type: PillTypes;
    pill_status: 'hormone' | 'placebo';
    reminder_enabled: boolean;
    reminder_time: string;
    createdAt: Date;
}

const PillTrackingSchema: Schema = new Schema<IPillTracking>({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    menstrual_cycle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenstrualCycle', required: true },
    pill_start_date: { type: Date, required: true },
    is_taken: { type: Boolean, default: false },
    pill_number: { type: Number, required: true },
    pill_type: { type: String, enum: ['21-day', '24+4', '21+7'], required: true },
    pill_status: { type: String, enum: ['hormone', 'placebo'], required: true },
    reminder_enabled: { type: Boolean, default: true },
    reminder_time: { type: String, required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false}
});

export const PillTracking = mongoose.model<IPillTracking>('PillTracking', PillTrackingSchema);
