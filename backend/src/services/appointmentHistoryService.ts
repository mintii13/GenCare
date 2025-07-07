import { AppointmentHistoryRepository } from '../repositories/appointmentHistoryRepository';
import { PaginationUtils } from '../utils/paginationUtils';
import { IAppointmentHistory } from '../models/AppointmentHistory';
import { AppointmentHistoryQuery } from '../dto/requests/AppointmentHistoryRequest';
import { AppointmentHistoryResponse } from '../dto/responses/AppointmentHistoryResponse';

export class AppointmentHistoryService {
    /**
     * Tạo history record mới
     */
    public static async createHistory(historyData: {
        appointment_id: string;
        action: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' | 'started';
        performed_by_user_id: string;
        performed_by_role: 'customer' | 'consultant' | 'staff' | 'admin';
        old_data?: any;
        new_data: any;
    }): Promise<AppointmentHistoryResponse> {
        try {
            const history = await AppointmentHistoryRepository.create(historyData);

            return {
                success: true,
                message: 'Appointment history created successfully',
                data: { history },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error creating appointment history:', error);
            return {
                success: false,
                message: 'Internal server error when creating appointment history'
            };
        }
    }

    /**
     * Lấy lịch sử của một appointment
     */
    public static async getAppointmentHistory(appointmentId: string): Promise<AppointmentHistoryResponse> {
        try {
            const history = await AppointmentHistoryRepository.findByAppointmentId(appointmentId);

            return {
                success: true,
                message: history.length > 0
                    ? 'Appointment history retrieved successfully'
                    : 'No history found for this appointment',
                data: { history },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting appointment history:', error);
            return {
                success: false,
                message: 'Internal server error when getting appointment history'
            };
        }
    }

    /**
     * Lấy lịch sử theo user (ai đã thực hiện actions)
     */
    public static async getUserActivityHistory(
        userId: string,
        limit: number = 50
    ): Promise<AppointmentHistoryResponse> {
        try {
            const history = await AppointmentHistoryRepository.findByUserId(userId, limit);

            return {
                success: true,
                message: history.length > 0
                    ? 'User activity history retrieved successfully'
                    : 'No activity found for this user',
                data: { history },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting user activity history:', error);
            return {
                success: false,
                message: 'Internal server error when getting user activity history'
            };
        }
    }

    /**
     * Get appointment history với pagination và filtering
     */
    public static async getAppointmentHistoryWithPagination(query: AppointmentHistoryQuery): Promise<AppointmentHistoryResponse> {
        try {
            // Validate pagination parameters
            const { page, limit, sort_by, sort_order } = PaginationUtils.validatePagination(query);

            // Build filter query
            const filters = PaginationUtils.buildAppointmentHistoryFilter(query);

            // Get data từ repository
            const result = await AppointmentHistoryRepository.findWithPagination(
                filters,
                page,
                limit,
                sort_by || 'timestamp',
                sort_order
            );

            // Calculate pagination info
            const pagination = PaginationUtils.calculatePagination(
                result.total,
                page,
                limit
            );

            // Build filters_applied object
            const filters_applied: any = {};
            if (query.appointment_id) filters_applied.appointment_id = query.appointment_id;
            if (query.action) filters_applied.action = query.action;
            if (query.performed_by_user_id) filters_applied.performed_by_user_id = query.performed_by_user_id;
            if (query.performed_by_role) filters_applied.performed_by_role = query.performed_by_role;
            if (query.date_from) filters_applied.date_from = query.date_from;
            if (query.date_to) filters_applied.date_to = query.date_to;
            if (query.sort_by) filters_applied.sort_by = query.sort_by;
            if (query.sort_order) filters_applied.sort_order = query.sort_order;

            return {
                success: true,
                message: result.appointmentHistories.length > 0
                    ? 'Appointment history retrieved successfully'
                    : 'No appointment history found matching the criteria',
                data: {
                    appointment_histories: result.appointmentHistories,
                    pagination,
                    filters_applied
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Appointment history service pagination error:', error);
            return {
                success: false,
                message: 'Internal server error when getting appointment history'
            };
        }
    }

    /**
     * Lấy thống kê actions
     */
    public static async getActionStats(
        startDate?: Date,
        endDate?: Date
    ): Promise<AppointmentHistoryResponse> {
        try {
            const stats = await AppointmentHistoryRepository.getActionStats(startDate, endDate);

            return {
                success: true,
                message: 'Action statistics retrieved successfully',
                data: {
                    action_stats: stats,
                    date_range: {
                        start_date: startDate,
                        end_date: endDate
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting action stats:', error);
            return {
                success: false,
                message: 'Internal server error when getting action statistics'
            };
        }
    }

    /**
     * Lấy thống kê hoạt động theo role
     */
    public static async getRoleStats(
        startDate?: Date,
        endDate?: Date
    ): Promise<AppointmentHistoryResponse> {
        try {
            const stats = await AppointmentHistoryRepository.getRoleStats(startDate, endDate);

            return {
                success: true,
                message: 'Role statistics retrieved successfully',
                data: {
                    role_stats: stats,
                    date_range: {
                        start_date: startDate,
                        end_date: endDate
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting role stats:', error);
            return {
                success: false,
                message: 'Internal server error when getting role statistics'
            };
        }
    }

    /**
     * Lấy hoạt động gần đây
     */
    public static async getRecentActivity(limit: number = 20): Promise<AppointmentHistoryResponse> {
        try {
            const activities = await AppointmentHistoryRepository.getRecentActivity(limit);

            return {
                success: true,
                message: activities.length > 0
                    ? 'Recent activities retrieved successfully'
                    : 'No recent activities found',
                data: { activities },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting recent activity:', error);
            return {
                success: false,
                message: 'Internal server error when getting recent activities'
            };
        }
    }

    /**
     * Xóa lịch sử cũ (cleanup)
     */
    public static async cleanupOldHistory(beforeDate: Date): Promise<AppointmentHistoryResponse> {
        try {
            const result = await AppointmentHistoryRepository.deleteOldHistory(beforeDate);

            return {
                success: true,
                message: `Successfully deleted ${result.deletedCount} old history records`,
                data: {
                    deleted_count: result.deletedCount,
                    before_date: beforeDate
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error cleaning up old history:', error);
            return {
                success: false,
                message: 'Internal server error when cleaning up old history'
            };
        }
    }

    // ===================================================================
    // HELPER METHODS - Để compatibility với appointmentService.ts
    // ===================================================================

    /**
     * Helper: Tạo history cho việc tạo appointment mới
     */
    public static async logAppointmentCreated(
        appointmentId: string,
        appointmentData: any,
        userId: string,
        userRole: string
    ): Promise<void> {
        try {
            await AppointmentHistoryRepository.create({
                appointment_id: appointmentId,
                action: 'created',
                performed_by_user_id: userId,
                performed_by_role: userRole as any,
                new_data: appointmentData
            });
        } catch (error) {
            console.error('Error logging appointment created:', error);
            // Don't throw - history logging shouldn't break main flow
        }
    }

    /**
     * Helper: Tạo history cho việc confirm appointment
     */
    public static async logAppointmentConfirmed(
        appointmentId: string,
        oldData: any,
        newData: any,
        userId: string,
        userRole: string
    ): Promise<void> {
        try {
            await AppointmentHistoryRepository.create({
                appointment_id: appointmentId,
                action: 'confirmed',
                performed_by_user_id: userId,
                performed_by_role: userRole as any,
                old_data: oldData,
                new_data: newData
            });
        } catch (error) {
            console.error('Error logging appointment confirmed:', error);
        }
    }

    /**
     * Helper: Tạo history cho việc cancel appointment
     */
    public static async logAppointmentCancelled(
        appointmentId: string,
        oldData: any,
        newData: any,
        userId: string,
        userRole: string
    ): Promise<void> {
        try {
            await AppointmentHistoryRepository.create({
                appointment_id: appointmentId,
                action: 'cancelled',
                performed_by_user_id: userId,
                performed_by_role: userRole as any,
                old_data: oldData,
                new_data: newData
            });
        } catch (error) {
            console.error('Error logging appointment cancelled:', error);
        }
    }

    /**
     * Helper: Tạo history cho việc update appointment
     */
    public static async logAppointmentUpdated(
        appointmentId: string,
        oldData: any,
        newData: any,
        userId: string,
        userRole: string,
        explicitAction?: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed'
    ): Promise<void> {
        try {
            // Nếu có action được chỉ định rõ ràng, sử dụng nó
            if (explicitAction) {
                await AppointmentHistoryRepository.create({
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

            await AppointmentHistoryRepository.create({
                appointment_id: appointmentId,
                action: actionType,
                performed_by_user_id: userId,
                performed_by_role: userRole as any,
                old_data: oldData,
                new_data: newData
            });
        } catch (error) {
            console.error('Error logging appointment updated:', error);
        }
    }

    /**
     * Helper: Tạo history cho việc complete appointment
     */
    public static async logAppointmentCompleted(
        appointmentId: string,
        oldData: any,
        newData: any,
        userId: string,
        userRole: string
    ): Promise<void> {
        try {
            await AppointmentHistoryRepository.create({
                appointment_id: appointmentId,
                action: 'completed',
                performed_by_user_id: userId,
                performed_by_role: userRole as any,
                old_data: oldData,
                new_data: newData
            });
        } catch (error) {
            console.error('Error logging appointment completed:', error);
        }
    }

    /**
     * Helper: Tạo history cho việc start meeting
     */
    public static async logMeetingStarted(
        appointmentId: string,
        oldData: any,
        newData: any,
        userId: string,
        userRole: string
    ): Promise<void> {
        try {
            await AppointmentHistoryRepository.create({
                appointment_id: appointmentId,
                action: 'started',
                performed_by_user_id: userId,
                performed_by_role: userRole as any,
                old_data: oldData,
                new_data: newData
            });
        } catch (error) {
            console.error('Error logging meeting started:', error);
        }
    }

    /**
     * Helper: Check if time-related fields changed
     */
    private static isTimeChanged(oldData: any, newData: any): boolean {
        return (
            oldData.appointment_date?.getTime() !== newData.appointment_date?.getTime() ||
            oldData.start_time !== newData.start_time ||
            oldData.end_time !== newData.end_time
        );
    }

    /**
 * Lấy lịch sử hoạt động của user với pagination
 */
    public static async getUserActivityHistoryWithPagination(
        userId: string,
        page: number = 1,
        limit: number = 20,
        sortBy: string = 'timestamp',
        sortOrder: 'asc' | 'desc' = 'desc'
    ): Promise<AppointmentHistoryResponse> {
        try {
            // Validate pagination parameters
            const { page: validPage, limit: validLimit, sort_by, sort_order } = PaginationUtils.validatePagination({
                page,
                limit,
                sort_by: sortBy,
                sort_order: sortOrder
            });

            // Build filter for specific user
            const filters = { performed_by_user_id: userId };

            // Get data từ repository với pagination
            const result = await AppointmentHistoryRepository.findWithPagination(
                filters,
                validPage,
                validLimit,
                sort_by,
                sort_order
            );

            // Calculate pagination info
            const pagination = PaginationUtils.calculatePagination(
                result.total,
                validPage,
                validLimit
            );

            return {
                success: true,
                message: result.appointmentHistories.length > 0
                    ? 'User activity history retrieved successfully'
                    : 'No activity found for this user',
                data: {
                    user_id: userId,
                    appointment_histories: result.appointmentHistories,
                    pagination,
                    filters_applied: {
                        user_id: userId,
                        sort_by: sort_by,
                        sort_order: sortOrder
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('User activity history pagination error:', error);
            return {
                success: false,
                message: 'Internal server error when getting user activity history'
            };
        }
    }
}