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
        overrideData: Partial<IOverridedSchedule> & {
            consultant_id: string;
            override_date: Date;
            created_by: { user_id: string, role: string, name: string }
        }
    ): Promise<ScheduleResponse> {
        try {
            // Kiểm tra consultant có tồn tại không
            const consultant = await Consultant.findById(overrideData.consultant_id);
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Kiểm tra có template schedule không
            const schedule = await WeeklyScheduleRepository.findByConsultantId(
                overrideData.consultant_id
            );

            if (!schedule) {
                return {
                    success: false,
                    message: 'No schedule template found for this consultant'
                };
            }

            // Kiểm tra conflict override
            const hasConflict = await OverridedScheduleRepository.checkOverrideConflict(
                overrideData.consultant_id,
                overrideData.override_date
            );

            if (hasConflict) {
                return {
                    success: false,
                    message: 'Override already exists for this date'
                };
            }

            const newOverride = await OverridedScheduleRepository.create({
                ...overrideData,
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
        overrideId: string,
        updateData: Partial<IOverridedSchedule>
    ): Promise<ScheduleResponse> {
        try {
            const existingOverride = await OverridedScheduleRepository.findById(overrideId);
            if (!existingOverride) {
                return {
                    success: false,
                    message: 'Override not found'
                };
            }

            // Nếu có thay đổi ngày, kiểm tra conflict
            if (updateData.override_date) {
                const hasConflict = await OverridedScheduleRepository.checkOverrideConflict(
                    existingOverride.consultant_id.toString(),
                    updateData.override_date,
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
     * Lấy override by ID
     */
    public static async getOverrideById(overrideId: string): Promise<ScheduleResponse> {
        try {
            const override = await OverridedScheduleRepository.findById(overrideId);
            if (!override) {
                return {
                    success: false,
                    message: 'Override not found'
                };
            }

            return {
                success: true,
                message: 'Override retrieved successfully',
                data: {
                    schedule: override
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get override by id service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving override'
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
     * Xóa cứng override
     */
    public static async deleteOverride(overrideId: string): Promise<ScheduleResponse> {
        try {
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
                // Nếu có override và có thời gian làm việc, sử dụng override
                if (override.start_time && override.end_time) {
                    const slots = this.generateTimeSlots(
                        override.start_time,
                        override.end_time,
                        override.break_start,
                        override.break_end
                    );

                    return {
                        success: true,
                        message: 'Schedule retrieved successfully (override)',
                        data: {
                            date: date.toISOString().split('T')[0],
                            consultant_id: consultantId,
                            available_slots: slots,
                            total_slots: slots.length
                        },
                        timestamp: new Date().toISOString()
                    };
                } else {
                    // Nếu có override nhưng không có thời gian làm việc → nghỉ
                    return {
                        success: true,
                        message: 'Consultant is not available on this date (override)',
                        data: {
                            date: date.toISOString().split('T')[0],
                            consultant_id: consultantId,
                            available_slots: [],
                            total_slots: 0
                        },
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // Nếu không có override, lấy từ template schedule
            const schedule = await WeeklyScheduleRepository.findByConsultantId(consultantId);

            if (!schedule) {
                return {
                    success: false,
                    message: 'No schedule found for this consultant'
                };
            }

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
                workingDay.break_start,
                workingDay.break_end
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
        const slotDuration = 30; // 30 minutes per slot

        // Parse time string to minutes
        const parseTime = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Format minutes back to time string
        const formatTime = (minutes: number): string => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const startMinutes = parseTime(startTime);
        const endMinutes = parseTime(endTime);

        // Convert break to minutes (if exists)
        let breakStartMinutes: number | null = null;
        let breakEndMinutes: number | null = null;

        if (breakStart && breakEnd) {
            breakStartMinutes = parseTime(breakStart);
            breakEndMinutes = parseTime(breakEnd);
        }

        let currentTime = startMinutes;

        while (currentTime + slotDuration <= endMinutes) {
            const slotEndTime = currentTime + slotDuration;

            // Check if slot conflicts with break period
            let conflictsWithBreak = false;
            if (breakStartMinutes !== null && breakEndMinutes !== null) {
                // Slot conflicts if it overlaps with break period
                conflictsWithBreak = (currentTime < breakEndMinutes && slotEndTime > breakStartMinutes);
            }

            if (!conflictsWithBreak) {
                slots.push({
                    start_time: formatTime(currentTime),
                    end_time: formatTime(slotEndTime),
                    is_available: true
                });
            }

            currentTime += slotDuration;

            // Skip to end of break if current time is within a break
            if (breakStartMinutes !== null && breakEndMinutes !== null &&
                currentTime >= breakStartMinutes && currentTime < breakEndMinutes) {
                currentTime = breakEndMinutes;
            }
        }

        return slots;
    }
}