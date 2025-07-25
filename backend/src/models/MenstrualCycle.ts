import mongoose, { Document } from 'mongoose';

export interface IMenstrualCycle extends Document {
    user_id: mongoose.Types.ObjectId;
    cycle_start_date: Date;
    period_days: Date[];
    cycle_length?: number;
    notes?: string;
    predicted_cycle_end?: Date;
    predicted_ovulation_date?: Date;
    predicted_fertile_start?: Date;
    predicted_fertile_end?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const menstrualCycleSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cycle_start_date: { type: Date, required: true },
    period_days: [{ type: Date, required: true }],
    cycle_length: { type: Number },
    notes: { type: String },
    predicted_cycle_end: { type: Date },
    predicted_ovulation_date: { type: Date },
    predicted_fertile_start: { type: Date },
    predicted_fertile_end: { type: Date },
}, {
    timestamps: true
});

export const MenstrualCycle = mongoose.model<IMenstrualCycle>('MenstrualCycle', menstrualCycleSchema);
