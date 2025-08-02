import mongoose, { Document } from 'mongoose';

export interface IMenstrualCycle extends Document {
    user_id: mongoose.Types.ObjectId;
    cycle_start_date: Date;
    period_days: Date[]; // Changed to simple array of dates
    cycle_length?: number;
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
    period_days: [{ type: Date }], // Simple array of dates
    cycle_length: { type: Number },
    predicted_cycle_end: { type: Date },
    predicted_ovulation_date: { type: Date },
    predicted_fertile_start: { type: Date },
    predicted_fertile_end: { type: Date },
}, {
    timestamps: true
});

export const MenstrualCycle = mongoose.model<IMenstrualCycle>('MenstrualCycle', menstrualCycleSchema);
