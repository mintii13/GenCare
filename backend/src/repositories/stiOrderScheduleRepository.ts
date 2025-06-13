import { StiOrderSchedule, IStiOrderSchedule } from '../models/StiOrderSchedule';

export class StiOrderScheduleRepository{
    public static async findOrderDate(date: Date): Promise<IStiOrderSchedule | null> {
        try {
            return await StiOrderSchedule.findOne({ order_date: date });
        } catch (error) {
            console.error(error);
            throw(error);
        }
    }

    public static async insertStiOrderSchedule(stiOrderSchedule: IStiOrderSchedule): Promise<IStiOrderSchedule | null>{
        try {
            return await StiOrderSchedule.create(stiOrderSchedule);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async updateStiOrderSchedule(stiOrderSchedule: IStiOrderSchedule): Promise<IStiOrderSchedule | null>{
        try {
            return await stiOrderSchedule.save()
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}