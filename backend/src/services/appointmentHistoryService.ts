import { AppointmentHistory, IAppointmentHistory } from '../models/AppointmentHistory';
import mongoose from 'mongoose';

export class AppointmentHistoryService {
    /**
     * Tạo history record mới
     */
    public static async createHistory(historyData: {
        appointment_id: string;
        action: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated';
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
    public static async getAppointmentHistory(appointmentId: string): Promise<IAppointmentHistory[]> {
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
    public static async getUserActivityHistory(
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
     * Lấy thống kê actions
     */
    public static async getActionStats(
        startDate?: Date,
        endDate?: Date
    ): Promise<{ [key: string]: number }> {
        try {
            const matchQuery: any = {};

            if (startDate || endDate) {
                const dateQuery: any = {};
                if (startDate) dateQuery.$gte = startDate;
                if (endDate) dateQuery.$lte = endDate;
                matchQuery.timestamp = dateQuery;
            }

            const result = await AppointmentHistory.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$action', count: { $sum: 1 } } }
            ]);

            const stats: { [key: string]: number } = {};
            result.forEach(item => {
                stats[item._id] = item.count;
            });

            return stats;
        } catch (error) {
            console.error('Error getting action stats:', error);
            throw error;
        }
    }

    /**
     * Helper: Tạo history cho việc tạo appointment mới
     */
    public static async logAppointmentCreated(
        appointmentId: string,
        appointmentData: any,
        userId: string,
        userRole: string
    ): Promise<void> {
        await this.createHistory({
            appointment_id: appointmentId,
            action: 'created',
            performed_by_user_id: userId,
            performed_by_role: userRole as any,
            new_data: appointmentData
        });
    }

    /**
     * Helper: Tạo history cho việc update appointment với logic cải tiến
     */
    public static async logAppointmentUpdated(
        appointmentId: string,
        oldData: any,
        newData: any,
        userId: string,
        userRole: string,
        explicitAction?: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed'
    ): Promise<void> {
        // Nếu có action được chỉ định rõ ràng, sử dụng nó
        if (explicitAction) {
            await this.createHistory({
                appointment_id: appointmentId,
                action: explicitAction,
                performed_by_user_id: userId,
                performed_by_role: userRole as any,
                old_data: oldData,
                new_data: newData
            });
            return;
        }

        // Auto-detect action với logic cải tiến
        let actionType: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' = 'updated';

        // 1. Ưu tiên cao nhất: thay đổi status
        if (oldData.status !== newData.status) {
            switch (newData.status) {
                case 'confirmed':
                    actionType = 'confirmed';
                    break;
                case 'cancelled':
                    actionType = 'cancelled';
                    break;
                case 'completed':
                    actionType = 'completed';
                    break;
                default:
                    actionType = 'updated';
            }
        }
        // 2. Ưu tiên trung bình: thay đổi thời gian (chỉ khi status không đổi)
        else if (this.isTimeChanged(oldData, newData)) {
            actionType = 'rescheduled';
        }
        // 3. Ưu tiên thấp: chỉ thay đổi notes hoặc các field khác
        else {
            actionType = 'updated';
        }

        await this.createHistory({
            appointment_id: appointmentId,
            action: actionType,
            performed_by_user_id: userId,
            performed_by_role: userRole as any,
            old_data: oldData,
            new_data: newData
        });
    }

    /**
     * Helper: Kiểm tra có thay đổi thời gian không
     */
    private static isTimeChanged(oldData: any, newData: any): boolean {
        // So sánh appointment_date
        const oldDate = new Date(oldData.appointment_date).toISOString().split('T')[0];
        const newDate = new Date(newData.appointment_date).toISOString().split('T')[0];

        if (oldDate !== newDate) {
            return true;
        }

        // So sánh start_time và end_time
        if (oldData.start_time !== newData.start_time || oldData.end_time !== newData.end_time) {
            return true;
        }

        return false;
    }
}