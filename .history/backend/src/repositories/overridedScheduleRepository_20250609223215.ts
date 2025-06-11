import { OverridedSchedule, IOverridedSchedule } from '../models/OverridedSchedule';
import mongoose from 'mongoose';

export class OverridedScheduleRepository {
    public static async findByConsultantId(
        consultantId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<IOverridedSchedule[]> {
        try {
            const query: any = {
                consultant_id: consultantId,
                is_active: true
            };

            if (startDate || endDate) {
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

                query.override_date = dateQuery;
            }

            return await OverridedSchedule.find(query)
                .sort({ override_date: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding overrided schedules:', error);
            throw error;
        }
    }

    public static async findById(overrideId: string): Promise<IOverridedSchedule | null> {
        try {
            return await OverridedSchedule.findById(overrideId).lean();
        } catch (error) {
            console.error('Error finding overrided schedule by id:', error);
            throw error;
        }
    }

    public static async findByConsultantAndDate(
        consultantId: string,
        date: Date
    ): Promise<IOverridedSchedule | null> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            return await OverridedSchedule.findOne({
                consultant_id: consultantId,
                override_date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                is_active: true
            }).lean();
        } catch (error) {
            console.error('Error finding overrided schedule by consultant and date:', error);
            throw error;
        }
    }

    public static async create(overrideData: Partial<IOverridedSchedule>): Promise<IOverridedSchedule> {
        try {
            const override = new OverridedSchedule(overrideData);
            return await override.save();
        } catch (error) {
            console.error('Error creating overrided schedule:', error);
            throw error;
        }
    }

    public static async update(
        overrideId: string,
        updateData: Partial<IOverridedSchedule>
    ): Promise<IOverridedSchedule | null> {
        try {
            return await OverridedSchedule.findByIdAndUpdate(
                overrideId,
                { ...updateData, updated_date: new Date() },
                { new: true, runValidators: true }
            ).lean();
        } catch (error) {
            console.error('Error updating overrided schedule:', error);
            throw error;
        }
    }

    public static async delete(overrideId: string): Promise<IOverridedSchedule | null> {
        try {
            return await OverridedSchedule.findByIdAndDelete(overrideId).lean();
        } catch (error) {
            console.error('Error deleting overrided schedule:', error);
            throw error;
        }
    }

    public static async softDelete(overrideI