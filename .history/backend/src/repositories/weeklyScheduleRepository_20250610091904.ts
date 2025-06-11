import { WeeklySchedule, IWeeklySchedule } from '../models/WeeklySchedule';
import mongoose from 'mongoose';

export class WeeklyScheduleRepository {
    /**
     * Tìm schedule theo consultant ID (one schedule per consultant)
     */
    public static async findByConsultantId(consultantId: string): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findOne({
                consultant_id: consultantId,
                is_active: true
            }).lean();
        } catch (error) {
            console.error('Error finding weekly schedule by consultant ID:', error);
            throw error;
        }
    }

    /**
     * Tìm tất cả schedules active
     */
    public static async findAllActive(): Promise<IWeeklySchedule[]> {
        try {
            return await WeeklySchedule.find({
                is_active: true
            })
                .populate('consultant_id', 'user_id specialization qualifications')
                .sort({ created_date: -1 })
                .lean();
        } catch (error) {
            console.error('Error finding all active schedules:', error);
            throw error;
        }
    }

    /**
     * Tạo schedule mới
     */
    public static async create(scheduleData: Partial<IWeeklySchedule>): Promise<IWeeklySchedule> {
        try {
            const schedule = new WeeklySchedule(scheduleData);
            return await schedule.save();
        } catch (error) {
            console.error('Error creating weekly schedule:', error);
            throw error;
        }
    }

    /**
     * Update schedule theo consultant ID
     */
    public static async updateByConsultantId(
        consultantId: string,
        updateData: Partial<IWeeklySchedule>
    ): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findOneAndUpdate(
                {
                    consultant_id: consultantId,
                    is_active: true
                },
                {
                    ...updateData,
                    updated_date: new Date()
                },
                { new: true, runValidators: true }
            ).lean();
        } catch (error) {
            console.error('Error updating weekly schedule:', error);
            throw error;
        }
    }

    /**
     * Soft delete schedule theo consultant ID
     */
    public static async deleteByConsultantId(consultantId: string): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findOneAndUpdate(
                {
                    consultant_id: consultantId,
                    is_active: true
                },
                {
                    is_active: false,
                    updated_date: new Date()
                },
                { new: true }
            ).lean();
        } catch (error) {
            console.error('Error deleting weekly schedule:', error);
            throw error;
        }
    }

    /**
     * Hard delete schedule theo consultant ID (for testing/cleanup)
     */
    public static async hardDeleteByConsultantId(consultantId: string): Promise<boolean> {
        try {
            const result = await WeeklySchedule.findOneAndDelete({
                consultant_id: consultantId
            });
            return !!result;
        } catch (error) {
            console.error('Error hard deleting weekly schedule:', error);
            throw error;
        }
    }

    /**
     * Check xem consultant đã có schedule chưa
     */
    public static async existsByConsultantId(consultantId: string): Promise<boolean> {
        try {
            const schedule = await WeeklySchedule.findOne({
                consultant_id: consultantId,
                is_active: true
            });
            return !!schedule;
        } catch (error) {
            console.error('Error checking schedule existence:', error);
            throw error;
        }
    }

    /**
     * Tìm schedule by ID (for backward compatibility)
     */
    public static async findById(scheduleId: string): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findById(scheduleId).lean();
        } catch (error) {
            console.error('Error finding weekly schedule by ID:', error);
            throw error;
        }
    }
}