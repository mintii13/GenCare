import mongoose, { Schema, Document } from 'mongoose';

export interface IStiTestSchedule extends Document{
    order_date: Date;
    number_current_orders: number;    
    is_locked: boolean;
    is_holiday: boolean;
}

const stiTestScheduleSchema = new Schema({
    order_date: { type: Date, unique: true, required: true },
    number_current_orders: { type: Number, default: 0, min: 0 },
    is_locked: { type: Boolean, default: false },
    is_holiday: { type: Boolean, default: false },
});

export const StiTestSchedule = mongoose.model<IStiTestSchedule>('StiTestSchedule', stiTestScheduleSchema);