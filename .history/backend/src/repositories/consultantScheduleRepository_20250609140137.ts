import { ConsultantSchedule, IConsultantSchedule } from '../models/ConsultantSchedule';
import mongoose from 'mongoose';

export class ConsultantScheduleRepository {
    public static async findByConsultantId(
        consultantId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<IConsultantSchedule[]> {
        try {
            const query: any = { consultant_id: consultantId };

            // Nếu không có cả startDate và endDate, lấy tất cả schedule
            if (!startDate && !endDate) {
                return await ConsultantSchedule.find(query)
                    .sort({ date: 1 })
                    .lean();
            }

            // Tạo điều kiện ngày
            const dateQuery: any = {};

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                dateQuery.$gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateQuery.$lte = end;
            }

            // Chỉ thêm điều kiện ngày vào query nếu có ít nhất một điều kiện
            if (Object.keys(dateQuery).length > 0) {
                query.date = dateQuery;
            }

            console.log('Schedule query:', JSON.stringify(query, null, 2));

            return await ConsultantSchedule.find(query)
                .sort({ date: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding consultant schedules:', error);
            throw error;
        }
    }

    public static async findById(scheduleId: string): Promise<IConsultantSchedule | null> {
        try {
            return await ConsultantSchedule.findById(scheduleId).lean();
        } catch (error) {
            console.error('Error finding schedule by id:', error);
            throw error;
        }
    }

    public static async findByConsultantAndDate(
        consultantId: string,
        date: Date
    ): Promise<IConsultantSchedule | null> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            return await ConsultantSchedule.findOne({
                consultant_id: consultantId,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            }).lean();
        } catch (error) {
            console.error('Error finding schedule by consultant and date:', error);
            throw error;
        }
    }

    public static async create(scheduleData: Partial<IConsultantSchedule>): Promise<IConsultantSchedule> {
        try {
            return await ConsultantSchedule.create(scheduleData);
        } catch (error) {
            console.error('Error creating consultant schedule:', error);
            throw error;
        }
    }

    public static async updateById(
        scheduleId: string,
        updateData: Partial<IConsultantSchedule>
    ): Promise<IConsultantSchedule | null> {
        try {
            return await ConsultantSchedule.findByIdAndUpdate(
                scheduleId,
                { ...updateData, updated_date: new Date() },
                { new: true, runValidators: true }
            ).lean();
        } catch (error) {
            console.error('Error updating consultant schedule:', error);
            throw error;
        }
    }

    public static async deleteById(scheduleId: string): Promise<boolean> {
        try {
            const result = await ConsultantSchedule.findByIdAndDelete(scheduleId);
            return !!result;
        } catch (error) {
            console.error('Error deleting consultant schedule:', error);
            throw error;
        }
    }

    public static async findAvailableSchedules(
        consultantId: string,
        date: Date
    ): Promise<IConsultantSchedule[]> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            return await ConsultantSchedule.find({
                consultant_id: consultantId,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                is_available: true
            }).lean();
        } catch (error) {
            console.error('Error finding available schedules:', error);
            throw error;
        }
    }

    public static async checkScheduleConflict(
        consultantId: string,
        date: Date,
        excludeScheduleId?: string
    ): Promise<boolean> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const query: any = {
                consultant_id: consultantId,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            };

            if (excludeScheduleId) {
                query._id = { $ne: excludeScheduleId };
            }

            const existingSchedule = await ConsultantSchedule.findOne(query);
            return !!existingSchedule;
        } catch (error) {
            console.error('Error checking schedule conflict:', error);
            throw error;
        }
    }
}