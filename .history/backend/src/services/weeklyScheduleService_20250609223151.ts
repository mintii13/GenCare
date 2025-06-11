import { WeeklyScheduleRepository } from '../repositories/weeklyScheduleRepository';
import { Consultant } from '../models/Consultant';
import { IWeeklySchedule } from '../models/WeeklySchedule';
import { ScheduleResponse, SchedulesResponse } from '../dto/responses/consultantScheduleResponse';

export class WeeklyScheduleService {
    /**
     * Tạo template lịch làm việc mới - FIXED: Allow consultant to create own schedule
     */
    public static async createSchedule(
        userRole: string,
        scheduleData: Partial<IWeeklySchedule> & { consultant_id: string }
    ): Promise<ScheduleResponse> {
        try {
            // Allow consultant, staff, and admin to create schedules
            if (!['consultant', 'staff', 'admin'].includes(userRole)) {
                return {
                    success: false,
                    message: 'Unauthorized to create schedules'
                };
            }

            // Kiểm tra consultant có tồn tại không
            const consultant = await Consultant.findById(scheduleData.consultant_id);
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Kiểm tra conflict schedule
            const hasConflict = await WeeklyScheduleRepository.checkActiveScheduleConflict(
                scheduleData.consultant_id,
                scheduleData.effective_from!,
                scheduleData.effective_to
            );

            if (hasConflict) {
                return {
                    success: false,
                    message: 'Schedule conflict with existing active schedule'
                };
            }

            const newSchedule = await WeeklyScheduleRepository.create({
                ...scheduleData,
                created_date: new Date(),
                updated_date: new Date()
            });

            return {
                success: true,
                message: 'Schedule created successfully',
                data: {
                    schedule: newSchedule
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Create schedule service error:', error);
            return {
                success: false,
                message: 'Internal server error when creating schedule'
            };
        }
    }

    /**
     * Cập nhật template lịch làm việc - FIXED: Allow consultant to update own schedule
     */
    public static async updateSchedule(
        userRole: string,
        scheduleId: string,
        updateData: Partial<IWeeklySchedule>
    ): Promise<ScheduleResponse> {
        try {
            // Allow consultant, staff, and admin to update schedules
            if (!['consultant', 'staff', 'admin'].includes(userRole)) {
                return {
                    success: false,
                    message: 'Unauthorized to update schedules'
                };
            }

            const existingSchedule = await WeeklyScheduleRepository.findById(scheduleId);
            if (!existingSchedule) {
                return {
                    success: false,
                    message: 'Schedule not found'
                };
            }

            // Nếu có thay đổi thời gian hiệu lực, kiểm tra conflict
            if (updateData.effective_from || updateData.effective_to) {
                const hasConflict = await WeeklyScheduleRepository.checkActiveScheduleConflict(
                    existingSchedule.consultant_id.toString(),
                    updateData.effective_from || existingSchedule.effective_from,
                    updateData.effective_to || existingSchedule.effective_to
                );

                if (hasConflict) {
                    return {
                        success: false,
                        message: 'Schedule conflict with existing active schedule'
                    };
                }
            }

            const updatedSchedule = await WeeklyScheduleRepository.update(scheduleId, updateData);
            if (!updatedSchedule) {
                return {
                    success: false,
                    message: 'Failed to update schedule'
                };
            }

            return {
                success: true,
                message: 'Schedule updated successfully',
                data: {
                    schedule: updatedSchedule
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update schedule service error:', error);
            return {
                success: false,
                message: 'Internal server error when updating schedule'
            };
        }
    }

    /**
     * Lấy danh sách template lịch làm việc của consultant
     */
    public static async getConsultantSchedules(
        consultantId: string,
        includeInactive: boolean = false
    ): Promise<SchedulesResponse> {
        try {
            const schedules = await WeeklyScheduleRepository.findByConsultantId(
                consultantId,
                !includeInactive
            );

            return {
                success: true,
                message: 'Schedules retrieved successfully',
                data: {
                    schedules,
                    total: schedules.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get consultant schedules service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving schedules'
            };
        }
    }

    /**
     * Lấy schedule by ID
     */
    public static async getScheduleById(scheduleId: string): Promise<ScheduleResponse> {
        try {
            const schedule = await WeeklyScheduleRepository.findById(scheduleId);
            if (!schedule) {
                return {
                    success: false,
                    message: 'Schedule not found'
                };
            }

            return {
                success: true,
                message: 'Schedule retrieved successfully',
                data: {
                    schedule
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get schedule by id service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving schedule'
            };
        }
    }

    /**
     * Vô hiệu hóa template lịch làm việc - FIXED: Allow consultant to deactivate own schedule
     */
    public static async deactivateSchedule(
        userRole: string,
        scheduleId: string
    ): Promise<ScheduleResponse> {
        try {
            // Allow consultant, staff, and admin to deactivate schedules
            if (!['consultant', 'staff', 'admin'].includes(userRole)) {
                return {
                    success: false,
                    message: 'Unauthorized to deactivate schedules'
                };
            }

            const existingSchedule = await WeeklyScheduleRepository.findById(scheduleId);
            if (!existingSchedule) {
                return {
                    success: false,
                    message: 'Schedule not found'
                };
            }

            const deactivatedSchedule = await WeeklyScheduleRepository.deactivate(scheduleId);
            if (!deactivatedSchedule) {
                return {
                    success: false,
                    message: 'Failed to deactivate schedule'
                };
            }

            return {
                success: true,
                message: 'Schedule deactivated successfully',
                data: {
                    schedule: deactivatedSchedule
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Deactivate schedule service error:', error);
            return {
                success: false,
                message: 'Internal server error when deactivating schedule'
            };
        }
    }
}