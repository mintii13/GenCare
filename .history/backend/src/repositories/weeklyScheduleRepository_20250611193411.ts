import { WeeklySchedule, IWeeklySchedule } from '../models/WeeklySchedule';
import mongoose from 'mongoose';
import moment from 'moment';

export class WeeklyScheduleRepository {
    /**
     * Tìm schedule theo consultant ID và tuần
     */
    public static async findByConsultantAndWeek(
        consultantId: string,
        weekStartDate: Date
    ): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findOne({
                consultant_id: consultantId,
                week_start_date: weekStartDate
            }).lean();
        } catch (error) {
            console.error('Error finding weekly schedule by consultant and week:', error);
            throw error;
        }
    }

    /**
     * Tìm schedules theo consultant ID trong khoảng thời gian
     */
    public static async findByConsultantIdInRange(
        consultantId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<IWeeklySchedule[]> {
        try {
            const query: any = {
                consultant_id: consultantId
            };

            if (startDate || endDate) {
                const dateQuery: any = {};

                if (startDate) {
                    dateQuery.$gte = startDate;
                }

                if (endDate) {
                    dateQuery.$lte = endDate;
                }

                query.week_start_date = dateQuery;
            }

            return await WeeklySchedule.find(query)
                .sort({ week_start_date: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding weekly schedules by consultant in range:', error);
            throw error;
        }
    }

    /**
     * Tìm tất cả schedules
     */
    public static async findAll(
        startDate?: Date,
        endDate?: Date,
        consultantId?: string
    ): Promise<IWeeklySchedule[]> {
        try {
            const query: any = {};

            if (consultantId) {
                query.consultant_id = consultantId;
            }

            if (startDate || endDate) {
                const dateQuery: any = {};

                if (startDate) {
                    dateQuery.$gte = startDate;
                }

                if (endDate) {
                    dateQuery.$lte = endDate;
                }

                query.week_start_date = dateQuery;
            }

            return await WeeklySchedule.find(query)
                .populate('consultant_id', 'user_id specialization qualifications')
                .populate('created_by.user_id', 'full_name email role')
                .sort({ week_start_date: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding all schedules:', error);
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
     * Update schedule theo ID
     */
    public static async updateById(
        scheduleId: string,
        updateData: Partial<IWeeklySchedule>
    ): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findByIdAndUpdate(
                scheduleId,
                {
                    ...updateData,
                    updated_date: new Date()
                },
                {
                    new: true,
                    runValidators: true
                }
            ).lean();
        } catch (error) {
            console.error('Error updating weekly schedule:', error);
            throw error;
        }
    }

    /**
     * Xóa schedule theo ID
     */
    public static async deleteById(scheduleId: string): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findByIdAndDelete(scheduleId).lean();
        } catch (error) {
            console.error('Error deleting weekly schedule:', error);
            throw error;
        }
    }

    /**
     * Kiểm tra schedule đã tồn tại cho tuần đó chưa
     */
    public static async existsByConsultantAndWeek(
        consultantId: string,
        weekStartDate: Date
    ): Promise<boolean> {
        try {
            const schedule = await WeeklySchedule.findOne({
                consultant_id: consultantId,
                week_start_date: weekStartDate
            });
            return !!schedule;
        } catch (error) {
            console.error('Error checking schedule existence:', error);
            throw error;
        }
    }

    /**
     * Tìm schedule by ID
     */
    public static async findById(scheduleId: string): Promise<IWeeklySchedule | null> {
        try {
            return await WeeklySchedule.findById(scheduleId).lean();
        } catch (error) {
            console.error('Error finding weekly schedule by ID:', error);
            throw error;
        }
    }

    /**
     * Tìm schedules của consultant trong tương lai (từ tuần hiện tại)
     */
    public static async findFutureSchedules(consultantId: string): Promise<IWeeklySchedule[]> {
        try {
            const now = new Date();
            const currentWeekStart = this.getWeekStartDate(now);

            return await WeeklySchedule.find({
                consultant_id: consultantId,
                week_start_date: { $gte: currentWeekStart }
            })
                .sort({ week_start_date: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding future schedules:', error);
            throw error;
        }
    }

    /**
     * Helper: Tính ngày bắt đầu tuần (thứ 2)
     */

    /**
     * Helper: Tính ngày kết thúc tuần (chủ nhật)
     */
    public static getWeekEndDate(date: Date): Date {
        const weekStart = this.getWeekStartDate(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return weekEnd;
    }

    /**
     * Tìm schedule cho một ngày cụ thể
     */
    // Trong weeklyScheduleRepository.ts - findByConsultantAndDate method
    // Thêm debug logs

    public static async findByConsultantAndDate(
        consultantId: string,
        date: Date
    ): Promise<IWeeklySchedule | null> {
        try {
            console.log('=== DEBUG REPOSITORY ===');
            console.log('Input consultantId:', consultantId);
            console.log('Input date:', date);

            const weekStart = this.getWeekStartDate(date);
            console.log('Calculated week start:', weekStart);
            console.log('Week start ISO:', weekStart.toISOString());

            // Debug: Check if consultant exists in any schedule
            const anySchedule = await WeeklySchedule.findOne({
                consultant_id: consultantId
            }).lean();
            console.log('Any schedule for consultant:', anySchedule);

            // Main query
            const schedule = await WeeklySchedule.findOne({
                consultant_id: consultantId,
                week_start_date: weekStart
            }).lean();

            console.log('Found schedule:', schedule);

            // If not found, check with date range
            if (!schedule) {
                console.log('No exact match, checking with date range...');

                const scheduleRange = await WeeklySchedule.findOne({
                    consultant_id: consultantId,
                    week_start_date: { $lte: weekStart },
                    week_end_date: { $gte: weekStart }
                }).lean();

                console.log('Schedule with range query:', scheduleRange);
            }

            return schedule;
        } catch (error) {
            console.error('Error finding schedule by consultant and date:', error);
            throw error;
        }
    }

    // Debug helper function
    // Quick fix trong weeklyScheduleRepository.ts

    public static getWeekStartDate(date: Date): Date {
        const d = new Date(date.getTime());
        const day = d.getUTCDay();

        // Fix: Tính toán đúng số ngày cần trừ
        const daysToSubtract = day === 0 ? 6 : day - 1;

        // Trừ về thứ 2
        d.setUTCDate(d.getUTCDate() - daysToSubtract);
        d.setUTCHours(0, 0, 0, 0);

        return d;
    }

    // Alternative: Sử dụng moment.js hoặc date-fns để tính chính xác hơn
    // npm install moment
    // import moment from 'moment';

    public static getWeekStartDateWithMoment(date: Date): Date {
        return moment(date).startOf('isoWeek').toDate(); // ISO week starts on Monday
    }
}