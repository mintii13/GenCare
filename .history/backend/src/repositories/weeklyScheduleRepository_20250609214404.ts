import { WeeklySchedule, IWeeklySchedule } from '../models/WeeklySchedule';
import mongoose from 'mongoose';

export class WeeklyScheduleRepository {
    public static async findByConsultantId(
        consultantId: string,
        isActive: boolean = true
    ): Promise<IWeeklySchedule[]> {
        try {
            const query: any = { consultant_id: consultantId };
            if (isActive) {
                query.is_active = true;
                query.effective_from = { $lte: new Date() };
                query.$or = [
                    { effective_to: { $gt: new Date() } },
                    { effective_to: null }
                ];
            }

            return await WeeklySchedule.find(query)
                .sort({ effective_from: -1 })
                .lean();
        } catch (error) {
            console.error('Error finding weekly schedules:', error);
            throw error;
        }
    }

    public static async findById(scheduleId: string): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findById(scheduleId).lean();
        } catch (error) {
            console.error('Error finding weekly schedule by id:', error);
            throw error;
        }
    }

    public static async create(scheduleData: Partial<IWeeklySchedule>): Promise<IWeeklySchedule> {
        try {
            const schedule = new WeeklySchedule(scheduleData);
            return await schedule.save();
        } catch (error) {
            console.error('Error creating weekly schedule:', error);
            throw error;
        }
    }

    public static async update(
        scheduleId: string,
        updateData: Partial<IWeeklySchedule>
    ): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findByIdAndUpdate(
                scheduleId,
                { ...updateData, updated_date: new Date() },
                { new: true }
            ).lean();
        } catch (error) {
            console.error('Error updating weekly schedule:', error);
            throw error;
        }
    }

    public static async deactivate(scheduleId: string): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findByIdAndUpdate(
                scheduleId,
                {
                    is_active: false,
                    effective_to: new Date(),
                    updated_date: new Date()
                },
                { new: true }
            ).lean();
        } catch (error) {
            console.error('Error deactivating weekly schedule:', error);
            throw error;
        }
    }

    public static async checkActiveScheduleConflict(
        consultantId: string,
        effectiveFrom: Date,
        effectiveTo?: Date
    ): Promise<boolean> {
        try {
            const query: any = {
                consultant_id: consultantId,
                is_active: true
            };

            if (effectiveTo) {
                query.$or = [
                    {
                        effective_from: { $lte: effectiveTo },
                        $or: [
                            { effective_to: { $gte: effectiveFrom } },
                            { effective_to: null }
                        ]
                    }
                ];
            } else {
                query.effective_from = { $lte: effectiveFrom };
                query.$or = [
                    { effective_to: { $gte: effectiveFrom } },
                    { effective_to: null }
                ];
            }

            const existingSchedule = await WeeklySchedule.findOne(query);
            return !!existingSchedule;
        } catch (error) {
            console.error('Error checking schedule conflict:', error);
            throw error;
        }
    }
} 