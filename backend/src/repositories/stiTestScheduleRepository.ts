import mongoose from 'mongoose';
import { StiTestSchedule, IStiTestSchedule } from '../models/StiTestSchedule';

export class StiTestScheduleRepository{
    public static async findOrderDate(date: Date): Promise<IStiTestSchedule | null> {
        try {
            return await StiTestSchedule.findOne({ order_date: date });
        } catch (error) {
            console.error(error);
            throw(error);
        }
    }

    public static async findById(id: mongoose.Types.ObjectId){
        try {
            return await StiTestSchedule.findById(id)
        } catch (error) {
            console.error(error);
            throw(error);
        }
    }
    public static async insertStiTestSchedule(stiTestSchedule: IStiTestSchedule): Promise<IStiTestSchedule | null>{
        try {
            return await stiTestSchedule.save();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async updateStiTestSchedule(stiTestSchedule: IStiTestSchedule): Promise<IStiTestSchedule | null>{
        try {
            return await stiTestSchedule.save()
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getAllStiTestSchedule(): Promise<IStiTestSchedule[] | null>{
        try {
            return await StiTestSchedule.find().sort({ order_date: 1 }).lean<IStiTestSchedule[]>();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}