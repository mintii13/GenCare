import { OverridedScheduleRepository } from '../repositories/overridedScheduleRepository';
import { WeeklyScheduleRepository } from '../repositories/weeklyScheduleRepository';
import { Consultant } from '../models/Consultant';
import { IOverridedSchedule } from '../models/OverridedSchedule';
import { ScheduleResponse, SchedulesResponse, AvailabilityResponse, TimeSlot } from '../dto/responses/consultantScheduleResponse';

export class OverridedScheduleService {
    /**
     * Tạo override cho một ngày cụ thể
     */
    public static async createOverride(
        userRole: string,
        overrideData: Partial<IOverridedSchedule> & { consultant_id: string; date: Date }
    ): Promise<ScheduleResponse> {
        try {
            if (userRole !== 'staff' && userRole !== 'admin') {
                return {
                    success: false,
                    message: 'Only staff and admin can create overrides'
                };
            }

            // Kiểm tra consultant có tồn tại không
            const consultant = await Consultant.findById(overrideData.consultant_id);
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Kiểm tra có template schedule active không
            const activeSchedules = await WeeklyScheduleRepository.findByConsultantId(
                overrideData.consultant_id,
                true
            );

            if (activeSchedules.length === 0) {
                return {
                    success: false,
                    message: 'No active schedule template found for this consultant'
                };
            }

            // Kiểm tra conflict override
            const hasConflict = await OverridedScheduleRepository.checkOverrideConflict(
                overrideData.consultant_id,
                overrideData.date
            );

            if (hasConflict) {
                return {
                    success: false,
                    message: 'Override already exists for this date'
                };
            }

            const newOverride = await OverridedScheduleRepository.create({
                ...overrideData,
                schedule_id: activeSchedules[0]._id,
                created_date: new Date(),
                updated_date: new Date()
            });

            return {
                success: true,
                message: 'Override created successfully',
                data: {
                    schedule: newOverride
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Create override service error:', error);
            return {
                success: false,
                message: 'Internal server error when creating override'
            };
        }
    }

    /**
     * Cập nhật override
     */
    public static async updateOverride(
        userRole: string,
        overrideId: string,
        updateData: Partial<IOverridedSchedule>
    ): Promise<ScheduleResponse> {
        try {
            if (userRole !== 'staff' && userRole !== 'admin') {
                return {
                    success: false,
                    message: 'Only staff and admin can update overrides'
                };
            }

            const existingOverride = await OverridedScheduleRepository.findById(overrideId);
            if (!existingOverride) {
                return {
                    success: false,
                    message: 'Override not found'
                };
            }

            // Nếu có thay đổi ngày, kiểm tra conflict
            if (updateData.date) {
                const hasConflict = await OverridedScheduleRepository.checkOverrideConflict(
                    existingOverride.consultant_id.toString(),
                    updateData.date,
                    overrideId
                );

                if (hasConflict) {
                    return {
                        success: false,
                        message: 'Override conflict with existing override'
                    };
                }
            }

            const updatedOverride = await OverridedScheduleRepository.update(overrideId, updateData);
            if (!updatedOverride) {
                return {
                    success: false,
                    message: 'Failed to update override'
                };
            }

            return {
                success: true,
                message: 'Override updated successfully',
                data: {
                    schedule: updatedOverride
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update override service error:', error);
            return {
                success: false,
                message: 'Internal server error when updating override'
            };
        }
    }

    /**
     * Lấy danh sách override của consultant
     */
    public static async getConsultantOverrides(
        consultantId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<SchedulesResponse> {
        try {
            const overrides = await OverridedScheduleRepository.findByConsultantId(
                consultantId,
                startDate,
                endDate
            );

            return {
                success: true,
                message: 'Overrides retrieved successfully',
                data: {
                    schedules: overrides,
                    total: overrides.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get consultant overrides service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving overrides'
            };
        }
    }

    /**
     * Xóa override
     */
    public static async deleteOverride(
        userRole: string,
        overrideId: string
    ): Promise<ScheduleResponse> {
        try {
            if (userRole !== 'staff' && userRole !== 'admin') {
                return {
                    success: false,
                    message: 'Only staff and admin can delete overrides'
                };
            }

            const existingOverride = await OverridedScheduleRepository.findById(overrideId);
            if (!existingOverride) {
                return {
                    success: false,
                    message: 'Override not found'
                };
            }

            const deletedOverride = await OverridedScheduleRepository.delete(overrideId);
            if (!deletedOverride) {
                return {
                    success: false,
                    message: 'Failed to delete override'
                };
            }

            return {
                success: true,
                message: 'Override deleted successfully',
                data: {
                    schedule: deletedOverride
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete override service error:', error);
            return {
                success: false,
                message: 'Internal server error when deleting override'
            };
        }
    }

    /**
     * Lấy thông tin lịch làm việc của một ngày cụ thể
     */
    public static async getDaySchedule(
        consultantId: string,
        date: Date
    ): Promise<AvailabilityResponse> {
        try {
            // Kiểm tra override trước
            const override = await OverridedScheduleRepository.findByConsultantAndDate(
                consultantId,
                date
            );

            if (override) {
                // Nếu có override và không available, trả về empty slots
                if (!override.is_available) {
                    return {
                        success: true,
                        message: 'Consultant is not available on this date',
                        data: {
                            date: date.toISOString().split('T')[0],
                            consultant_id: consultantId,
                            available_slots: [],
                            total_slots: 0
                        },
                        timestamp: new Date().toISOString()
                    };
                }

                // Nếu có override và available, tạo slots từ override
                if (override.start_time && override.end_time) {
                    const slots = this.generateTimeSlots(
                        override.start_time,
                        override.end_time,
                        override.break_start,
                        override.break_end
                    );

                    return {
                        success: true,
                        message: 'Schedule retrieved successfully',
                        data: {
                            date: date.toISOString().split('T')[0],
                            consultant_id: consultantId,
                            available_slots: slots,
                            total_slots: slots.length
                        },
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // Nếu không có override hoặc override không có thời gian,
            // lấy từ template schedule
            const activeSchedules = await WeeklyScheduleRepository.findByConsultantId(
                consultantId,
                true
            );

            if (activeSchedules.length === 0) {
                return {
                    success: false,
                    message: 'No active schedule found for this consultant'
                };
            }

            const schedule = activeSchedules[0];
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const workingDay = schedule.working_days[dayOfWeek as keyof typeof schedule.working_days];

            if (!workingDay || !workingDay.is_available) {
                return {
                    success: true,
                    message: 'Consultant is not available on this date',
                    data: {
                        date: date.toISOString().split('T')[0],
                        consultant_id: consultantId,
                        available_slots: [],
                        total_slots: 0
                    },
                    timestamp: new Date().toISOString()
                };
            }

            const slots = this.generateTimeSlots(
                workingDay.start_time,
                workingDay.end_time,
                workingDay.breaks[0]?.start_time,
                workingDay.breaks[0]?.end_time
            );

            return {
                success: true,
                message: 'Schedule retrieved successfully',
                data: {
                    date: date.toISOString().split('T')[0],
                    consultant_id: consultantId,
                    available_slots: slots,
                    total_slots: slots.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get day schedule service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving schedule'
            };
        }
    }

    /**
     * Tạo danh sách các time slot từ thời gian làm việc
     */
    private static generateTimeSlots(
        startTime: string,
        endTime: string,
        breakStart?: string,
        breakEnd?: string
    ): TimeSlot[] {
        const slots: TimeSlot[] = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        let currentHour = startHour;
        let currentMinute = startMinute;

        while (
            currentHour < endHour ||
            (currentHour === endHour && currentMinute < endMinute)
        ) {
            const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMinute
                .toString()
                .padStart(2, '0')}`;

            // Tăng thời gian 30 phút
            currentMinute += 30;
            if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60);
                currentMinute = currentMinute % 60;
            }

            const slotEnd = `${currentHour.toString().padStart(2, '0')}:${currentMinute
                .toString()
                .padStart(2, '0')}`;

            // Kiểm tra nếu slot nằm trong thời gian nghỉ
            if (breakStart && breakEnd) {
                const [breakStartHour, breakStartMinute] = breakStart.split(':').map(Number);
                const [breakEndHour, breakEndMinute] = breakEnd.split(':').map(Number);

                const slotStartMinutes = currentHour * 60 + currentMinute;
                const slotEndMinutes = currentHour * 60 + currentMinute;
                const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
                const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

                if (
                    (slotStartMinutes >= breakStartMinutes && slotStartMinutes < breakEndMinutes) ||
                    (slotEndMinutes > breakStartMinutes && slotEndMinutes <= breakEndMinutes)
                ) {
                    continue;
                }
            }

            slots.push({
                start_time: slotStart,
                end_time: slotEnd,
                is_available: true
            });
        }

        return slots;
    }
} 