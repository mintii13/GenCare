import mongoose, { Document } from 'mongoose';

// Interface for daily mood data
export interface IDailyMoodData {
    mood: string;
    energy: string;
    symptoms: string[];
    notes?: string;
}

// Interface for period day with mood data
export interface IPeriodDay {
    date: Date;
    mood_data?: IDailyMoodData;
}

// Interface for mood data structure (date -> mood data) - for backward compatibility
export interface IMoodData {
    [date: string]: IDailyMoodData;
}

export interface IMenstrualCycle extends Document {
    user_id: mongoose.Types.ObjectId;
    cycle_start_date: Date;
    period_days: IPeriodDay[]; // Changed to array of objects with mood data
    cycle_length?: number;
    mood_data?: IMoodData; // Keep for backward compatibility
    predicted_cycle_end?: Date;
    predicted_ovulation_date?: Date;
    predicted_fertile_start?: Date;
    predicted_fertile_end?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const periodDaySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    mood_data: {
        mood: { type: String, enum: ['happy', 'sad', 'tired', 'excited', 'calm', 'stressed', 'neutral'], default: 'neutral' },
        energy: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
        symptoms: [{ type: String }],
        notes: { type: String }
    }
}, { _id: false });

const menstrualCycleSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cycle_start_date: { type: Date, required: true },
    period_days: [periodDaySchema], // Changed to array of period day objects
    cycle_length: { type: Number },
    mood_data: { 
        type: mongoose.Schema.Types.Mixed,
        default: {} 
    }, // Keep for backward compatibility
    predicted_cycle_end: { type: Date },
    predicted_ovulation_date: { type: Date },
    predicted_fertile_start: { type: Date },
    predicted_fertile_end: { type: Date },
}, {
    timestamps: true
});

export const MenstrualCycle = mongoose.model<IMenstrualCycle>('MenstrualCycle', menstrualCycleSchema);
