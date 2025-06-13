import mongoose, { Schema, Document } from 'mongoose';

export interface IStiOrderSchedule extends Document{
    order_date: Date;
    number_current_orders: number;    
    is_locked: boolean;
    is_holiday: boolean;
}

const stiOrderScheduleSchema = new mongoose.Schema({
    order_date: { type: Date, unique: true, required: true },
    number_current_orders: { type: Number, default: 1, min: 0 },
    is_locked: { type: Boolean, default: false },
    is_holiday: { type: Boolean, default: false },
});

export const StiOrderSchedule = mongoose.model<IStiOrderSchedule>('StiOrderSchedule', stiOrderScheduleSchema);
