import { WeeklyScheduleRepository } from '../repositories/weeklyScheduleRepository';
import { Consultant } from '../models/Consultant';
import { IWeeklySchedule } from '../models/WeeklySchedule';
import { ScheduleResponse, SchedulesResponse } from '../dto/responses/consultantScheduleResponse';

export class WeeklyScheduleService {
    /**
     * Tạo weekly schedule cho consultant (chỉ staff/admin) - One per consultant
     */
    public static async createSchedule(
        scheduleData: Partial<IWeeklySchedule> & { consultant_id: string }
    ): Promise<ScheduleResponse> {
        try {
            // Kiểm tra consultant có tồn tại không
            const consultant = await Consultant.findById(scheduleData.consultant_id);
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Kiểm tra xem consultant đã có schedule chưa (one per consultant)
            const existingSchedule = await WeeklyScheduleRepository.findByConsultantId(
                scheduleData.consultant_id
            );

            if (existingSchedule) {
                return {
                    success: false,
                    message: 'Consultant already has a weekly schedule. Use update instead.'
                };
            }

            // Auto-fill missing days with default values
            const completeWorkingDays = this.fillMissingDaysWithDefaults(scheduleData.working_days || {});

            const newSchedule = await WeeklyScheduleRepository.create({
                ...scheduleData,
                working_days: completeWorkingDays,
                created_date: new Date(),
                updated_date: new Date()
            });

            return {
                success: true,
                message: 'Weekly schedule created successfully',
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
     * Cập nhật weekly schedule (chỉ staff/admin)
     */
    public static async updateSchedule(
        consultantId: string,
        updateData: Partial<IWeeklySchedule>
    ): Promise<ScheduleResponse> {
        try {
            // Kiểm tra consultant có tồn tại không
            const consultant = await Consultant.findById(consultantId);
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Tìm existing schedule
            const existingSchedule = await WeeklyScheduleRepository.findByConsultantId(consultantId);
            if (!existingSchedule) {
                return {
                    success: false,
                    message: 'No weekly schedule found for this consultant'
                };
            }

            // Nếu có working_days trong update, merge với existing working_days
            let finalUpdateData = { ...updateData };
            if (updateData.working_days) {
                finalUpdateData.working_days = {
                    ...existingSchedule.working_days,
                    ...updateData.working_days
                };
            }

            console.log('Final update data:', JSON.stringify(finalUpdateData, null, 2));

            const updatedSchedule = await WeeklyScheduleRepository.updateByConsultantId(
                consultantId,
                finalUpdateData
            );

            if (!updatedSchedule) {
                return {
                    success: false,
                    message: 'Failed to update schedule'
                };
            }

            return {
                success: true,
                message: 'Weekly schedule updated successfully',
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
     * Lấy weekly schedule của consultant
     */
    public static async getConsultantSchedule(consultantId: string): Promise<ScheduleResponse> {
        try {
            const schedule = await WeeklyScheduleRepository.findByConsultantId(consultantId);

            if (!schedule) {
                return {
                    success: false,
                    message: 'No weekly schedule found for this consultant'
                };
            }

            return {
                success: true,
                message: 'Weekly schedule retrieved successfully',
                data: {
                    schedule
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get consultant schedule service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving schedule'
            };
        }
    }

    /**
     * Lấy tất cả schedules (chỉ staff/admin)
     */
    public static async getAllSchedules(): Promise<SchedulesResponse> {
        try {
            const schedules = await WeeklyScheduleRepository.findAll();

            return {
                success: true,
                message: 'All schedules retrieved successfully',
                data: {
                    schedules,
                    total: schedules.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get all schedules service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving schedules'
            };
        }
    }

    /**
     * Xóa cứng weekly schedule (chỉ staff/admin)
     */
    public static async deleteSchedule(consultantId: string): Promise<ScheduleResponse> {
        try {
            // Kiểm tra consultant có tồn tại không
            const consultant = await Consultant.findById(consultantId);
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Tìm existing schedule
            const existingSchedule = await WeeklyScheduleRepository.findByConsultantId(consultantId);
            if (!existingSchedule) {
                return {
                    success: false,
                    message: 'No weekly schedule found for this consultant'
                };
            }

            const deletedSchedule = await WeeklyScheduleRepository.deleteByConsultantId(consultantId);
            if (!deletedSchedule) {
                return {
                    success: false,
                    message: 'Failed to delete schedule'
                };
            }

            return {
                success: true,
                message: 'Weekly schedule deleted successfully',
                data: {
                    schedule: deletedSchedule
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete schedule service error:', error);
            return {
                success: false,
                message: 'Internal server error when deleting schedule'
            };
        }
    }

    /**
     * Helper function to fill missing days with default values
     */
    private static fillMissingDaysWithDefaults(workingDays: any): any {
        const defaultDay = {
            start_time: "08:00",
            end_time: "17:00",
            is_available: false
        };

        const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const completeWorkingDays: any = {};

        for (const day of allDays) {
            if (workingDays[day]) {
                // Nếu ngày đã có trong body, sử dụng giá trị đó
                completeWorkingDays[day] = workingDays[day];
            } else {
                // Nếu ngày thiếu, thêm giá trị default
                completeWorkingDays[day] = { ...defaultDay };
            }
        }

        return completeWorkingDays;
    }
}
