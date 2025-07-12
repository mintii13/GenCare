import { AppointmentHistory, IAppointmentHistory } from '../models/AppointmentHistory';
import mongoose from 'mongoose';

export class AppointmentHistoryRepository {
    /**
     * Tạo history record mới
     */
    public static async create(historyData: {
        appointment_id: string;
        action: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' | 'started';
        performed_by_user_id: string;
        performed_by_role: 'customer' | 'consultant' | 'staff' | 'admin';
        old_data?: any;
        new_data: any;
    }): Promise<IAppointmentHistory> {
        try {
            const history = new AppointmentHistory({
                appointment_id: new mongoose.Types.ObjectId(historyData.appointment_id),
                action: historyData.action,
                performed_by_user_id: new mongoose.Types.ObjectId(historyData.performed_by_user_id),
                performed_by_role: historyData.performed_by_role,
                old_data: historyData.old_data || null,
                new_data: historyData.new_data,
                timestamp: new Date()
            });

            return await history.save();
        } catch (error) {
            console.error('Error creating appointment history:', error);
            throw error;
        }
    }

    /**
     * Lấy lịch sử của một appointment
     */
    public static async findByAppointmentId(appointmentId: string): Promise<IAppointmentHistory[]> {
        try {
            return await AppointmentHistory.find({
                appointment_id: appointmentId
            })
                .populate('performed_by_user_id', 'full_name email role')
                .sort({ timestamp: 1 }) // Sắp xếp theo thời gian tăng dần
                .lean();
        } catch (error) {
            console.error('Error getting appointment history:', error);
            throw error;
        }
    }

    /**
     * Lấy lịch sử theo user (ai đã thực hiện actions)
     */
    public static async findByUserId(
        userId: string,
        limit: number = 50
    ): Promise<IAppointmentHistory[]> {
        try {
            return await AppointmentHistory.find({
                performed_by_user_id: userId
            })
                .populate('appointment_id', 'appointment_date start_time end_time status')
                .populate('performed_by_user_id', 'full_name email role')
                .sort({ timestamp: -1 }) // Sắp xếp theo thời gian giảm dần
                .limit(limit)
                .lean();
        } catch (error) {
            console.error('Error getting user activity history:', error);
            throw error;
        }
    }

    /**
     * Find appointment history với pagination và filtering
     */
    public static async findWithPagination(
        filters: any,
        page: number,
        limit: number,
        sortBy: string = 'timestamp',
        sortOrder: 1 | -1 = -1
    ): Promise<{
        appointmentHistories: any[];
        total: number;
    }> {
        try {
            // Build sort object
            const sortObj: any = {};
            sortObj[sortBy] = sortOrder;

            // Calculate skip
            const skip = (page - 1) * limit;

            // Execute queries in parallel
            const [appointmentHistories, total] = await Promise.all([
                AppointmentHistory.find(filters)
                    .populate({
                        path: 'appointment_id',
                        select: 'appointment_date start_time end_time status customer_id consultant_id',
                        populate: [
                            { path: 'customer_id', select: 'full_name email' },
                            { 
                                path: 'consultant_id', 
                                select: 'user_id specialization',
                                populate: {
                                    path: 'user_id',
                                    select: 'full_name email'
                                }
                            }
                        ]
                    })
                    .populate('performed_by_user_id', 'full_name email role')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limit)
                    .lean(),

                AppointmentHistory.countDocuments(filters)
            ]);

            return {
                appointmentHistories,
                total
            };
        } catch (error) {
            console.error('Error in appointment history pagination:', error);
            throw error;
        }
    }

    /**
     * Lấy thống kê actions
     */
    public static async getActionStats(
        startDate?: Date,
        endDate?: Date
    ): Promise<any> {
        try {
            const matchStage: any = {};

            if (startDate || endDate) {
                matchStage.timestamp = {};
                if (startDate) {
                    matchStage.timestamp.$gte = startDate;
                }
                if (endDate) {
                    matchStage.timestamp.$lte = endDate;
                }
            }

            const pipeline: any[] = [
                ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 as const }
                }
            ];

            const actionStats = await AppointmentHistory.aggregate(pipeline);

            // Convert to object for easier access
            const statsObj: any = {};
            actionStats.forEach(stat => {
                statsObj[stat._id] = stat.count;
            });

            return statsObj;
        } catch (error) {
            console.error('Error getting action stats:', error);
            throw error;
        }
    }

    /**
     * Lấy thống kê hoạt động theo role
     */
    public static async getRoleStats(
        startDate?: Date,
        endDate?: Date
    ): Promise<any> {
        try {
            const matchStage: any = {};

            if (startDate || endDate) {
                matchStage.timestamp = {};
                if (startDate) {
                    matchStage.timestamp.$gte = startDate;
                }
                if (endDate) {
                    matchStage.timestamp.$lte = endDate;
                }
            }

            const pipeline: any[] = [
                ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
                {
                    $group: {
                        _id: '$performed_by_role',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 as const }
                }
            ];

            const roleStats = await AppointmentHistory.aggregate(pipeline);

            // Convert to object for easier access
            const statsObj: any = {};
            roleStats.forEach(stat => {
                statsObj[stat._id] = stat.count;
            });

            return statsObj;
        } catch (error) {
            console.error('Error getting role stats:', error);
            throw error;
        }
    }

    public static async getRecentActivity(
        limit: number = 20
    ): Promise<IAppointmentHistory[]> {
        try {
            return await AppointmentHistory.find()
                .populate('appointment_id', 'appointment_date start_time end_time status customer_id consultant_id')
                .populate('performed_by_user_id', 'full_name email role')
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            console.error('Error getting recent activity:', error);
            throw error;
        }
    }

    /**
     * Xóa lịch sử cũ (cleanup)
     */
    public static async deleteOldHistory(
        beforeDate: Date
    ): Promise<{ deletedCount: number }> {
        try {
            const result = await AppointmentHistory.deleteMany({
                timestamp: { $lt: beforeDate }
            });

            return { deletedCount: result.deletedCount || 0 };
        } catch (error) {
            console.error('Error deleting old appointment history:', error);
            throw error;
        }
    }
}