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

            // Nếu không có cả startDate và endDate, lấy schedule của ngày hiện tại
            if (!startDate && !endDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                query.date = {
                    $gte: today,
                    $lt: tomorrow
                };
            } else {
                // Nếu có startDate hoặc endDate, áp dụng điều kiện tương ứng
                if (startDate) {
                    startDate.setHours(0, 0, 0, 0);
                    query.date = { ...query.date, $gte: startDate };
                }
                if (endDate) {
                    endDate.setHours(23, 59, 59, 999);
                    query.date = { ...query.date, $lte: endDate };
                }
            }

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