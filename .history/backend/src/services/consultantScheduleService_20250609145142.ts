import { ConsultantScheduleRepository } from '../repositories/consultantScheduleRepository';
import { Consultant } from '../models/Consultant';
import { User } from '../models/User';
import { CreateScheduleRequest, UpdateScheduleRequest } from '../dto/requests/ConsultantScheduleRequest';
import { ScheduleResponse, SchedulesResponse, AvailabilityResponse, TimeSlot } from '../dto/responses/ConsultantScheduleResponse';

export class ConsultantScheduleService {
    /**
     * Tạo lịch làm việc mới cho consultant (chỉ staff/admin)
     */
    public static async createSchedule(
        userRole: string,
        scheduleData: CreateScheduleRequest & { consultant_id: string }
    ): Promise<ScheduleResponse> {
        try {
            // Chỉ staff/admin mới được tạo schedule
            if (userRole !== 'staff' && userRole !== 'admin') {
                return {
                    success: false,
                    message: 'Only staff and admin can create schedules'
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

            const scheduleDate = new Date(scheduleData.date);

            // Kiểm tra conflict schedule
            const hasConflict = await ConsultantScheduleRepository.checkScheduleConflict(
                scheduleData.consultant_id,
                scheduleDate
            );

            if (hasConflict) {
                return {
                    success: false,
                    message: 'Schedule already exists for this date'
                };
            }

            const newSchedule = await ConsultantScheduleRepository.create({
                consultant_id: consultant._id,
                date: scheduleDate,
                start_time: scheduleData.start_time,
                end_time: scheduleData.end_time,
                break_start: scheduleData.break_start || undefined,
                break_end: scheduleData.break_end || undefined,
                is_available: scheduleData.is_available ?? true,
                created_date: new Date(),
                updated_date: new Date()
            });

            return {
                success: true,
                message: 'Schedule created successfully',
                data: {
                    schedule: {
                        _id: newSchedule._id,
                        consultant_id: newSchedule.consultant_id,
                        date: newSchedule.date,
                        start_time: newSchedule.start_time,
                        end_time: newSchedule.end_time,
                        break_start: newSchedule.break_start,
                        break_end: newSchedule.break_end,
                        is_available: newSchedule.is_available,
                        created_date: newSchedule.created_date,
                        updated_date: newSchedule.updated_date
                    }
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
     * Lấy danh sách lịch làm việc của consultant hoặc tất cả schedules
     */
    public static async getSchedules(
        userId: string,
        userRole: string,
        consultantId?: string,
        startDate?: string,
        endDate?: string
    ): Promise<SchedulesResponse> {
        try {
            let start: Date | undefined;
            let end: Date | undefined;

            if (startDate && startDate.trim() !== '') {
                start = new Date(startDate);
            }

            if (endDate && endDate.trim() !== '') {
                end = new Date(endDate);
            }

            // Nếu là staff hoặc admin, có thể xem tất cả schedules hoặc schedule của consultant cụ thể
            if (userRole === 'staff' || userRole === 'admin') {
                if (consultantId) {
                    // Xem schedule của consultant cụ thể
                    const schedules = await ConsultantScheduleRepository.findByConsultantId(
                        consultantId,
                        start,
                        end
                    );

                    return {
                        success: true,
                        message: 'Schedules retrieved successfully',
                        data: {
                            schedules: schedules.map(schedule => ({
                                _id: schedule._id,
                                consultant_id: schedule.consultant_id,
                                date: schedule.date,
                                start_time: schedule.start_time,
                                end_time: schedule.end_time,
                                break_start: schedule.break_start,
                                break_end: schedule.break_end,
                                is_available: schedule.is_available,
                                created_date: schedule.created_date,
                                updated_date: schedule.updated_date
                            })),
                            total: schedules.length
                        },
                        timestamp: new Date().toISOString()
                    };
                } else {
                    // Xem tất cả schedules
                    const allSchedules = await ConsultantScheduleRepository.findAllSchedules(start, end);

                    return {
                        success: true,
                        message: 'All schedules retrieved successfully',
                        data: {
                            schedules: allSchedules.map(schedule => ({
                                _id: schedule._id,
                                consultant_id: schedule.consultant_id,
                                date: schedule.date,
                                start_time: schedule.start_time,
                                end_time: schedule.end_time,
                                break_start: schedule.break_start,
                                break_end: schedule.break_end,
                                is_available: schedule.is_available,
                                created_date: schedule.created_date,
                                updated_date: schedule.updated_date
                            })),
                            total: allSchedules.length
                        },
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // Nếu là consultant, chỉ xem schedule của chính mình
            if (userRole === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: userId });
                if (!consultant) {
                    return {
                        success: false,
                        message: 'Consultant profile not found'
                    };
                }

                const schedules = await ConsultantScheduleRepository.findByConsultantId(
                    consultant._id.toString(),
                    start,
                    end
                );

                return {
                    success: true,
                    message: 'Schedules retrieved successfully',
                    data: {
                        schedules: schedules.map(schedule => ({
                            _id: schedule._id,
                            consultant_id: schedule.consultant_id,
                            date: schedule.date,
                            start_time: schedule.start_time,
                            end_time: schedule.end_time,
                            break_start: schedule.break_start,
                            break_end: schedule.break_end,
                            is_available: schedule.is_available,
                            created_date: schedule.created_date,
                            updated_date: schedule.updated_date
                        })),
                        total: schedules.length
                    },
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: false,
                message: 'Unauthorized to view schedules'
            };
        } catch (error) {
            console.error('Get schedules service error:', error);
            return {
                success: false,
                message: 'Internal server error when getting schedules'
            };
        }
    }

    /**
     * Cập nhật lịch làm việc (chỉ staff/admin)
     */
    public static async updateSchedule(
        userRole: string,
        scheduleId: string,
        updateData: UpdateScheduleRequest
    ): Promise<ScheduleResponse> {
        try {
            // Chỉ staff/admin mới được update schedule
            if (userRole !== 'staff' && userRole !== 'admin') {
                return {
                    success: false,
                    message: 'Only staff and admin can update schedules'
                };
            }

            // Kiểm tra schedule có tồn tại không
            const existingSchedule = await ConsultantScheduleRepository.findById(scheduleId);
            if (!existingSchedule) {
                return {
                    success: false,
                    message: 'Schedule not found'
                };
            }

            // Nếu cập nhật date, kiểm tra conflict
            if (updateData.date) {
                const newDate = new Date(updateData.date);
                const hasConflict = await ConsultantScheduleRepository.checkScheduleConflict(
                    existingSchedule.consultant_id.toString(),
                    newDate,
                    scheduleId
                );

                if (hasConflict) {
                    return {
                        success: false,
                        message: 'Schedule already exists for this date'
                    };
                }
            }

            const updatedSchedule = await ConsultantScheduleRepository.updateById(
                scheduleId,
                {
                    date: updateData.date ? new Date(updateData.date) : undefined,
                    start_time: updateData.start_time,
                    end_time: updateData.end_time,
                    break_start: updateData.break_start,
                    break_end: updateData.break_end,
                    is_available: updateData.is_available
                }
            );

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
                    schedule: {
                        _id: updatedSchedule._id,
                        consultant_id: updatedSchedule.consultant_id,
                        date: updatedSchedule.date,
                        start_time: updatedSchedule.start_time,
                        end_time: updatedSchedule.end_time,
                        break_start: updatedSchedule.break_start,
                        break_end: updatedSchedule.break_end,
                        is_available: updatedSchedule.is_available,
                        created_date: updatedSchedule.created_date,
                        updated_date: updatedSchedule.updated_date
                    }
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
     * Xóa lịch làm việc (chỉ staff/admin)
     */
    public static async deleteSchedule(
        userRole: string,
        scheduleId: string
    ): Promise<ScheduleResponse> {
        try {
            // Chỉ staff/admin mới được delete schedule
            if (userRole !== 'staff' && userRole !== 'admin') {
                return {
                    success: false,
                    message: 'Only staff and admin can delete schedules'
                };
            }

            // Kiểm tra schedule có tồn tại không
            const existingSchedule = await ConsultantScheduleRepository.findById(scheduleId);
            if (!existingSchedule) {
                return {
                    success: false,
                    message: 'Schedule not found'
                };
            }

            // TODO: Kiểm tra xem có appointment nào đã được đặt trong schedule này không
            // Nếu có, không cho phép xóa hoặc thông báo cho customer

            const deleted = await ConsultantScheduleRepository.deleteById(scheduleId);

            if (!deleted) {
                return {
                    success: false,
                    message: 'Failed to delete schedule'
                };
            }

            return {
                success: true,
                message: 'Schedule deleted successfully',
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
     * Lấy các slot thời gian có sẵn cho booking (2 giờ/slot)
     */
    public static async getAvailableTimeSlots(
        consultantId: string,
        date: string
    ): Promise<AvailabilityResponse> {
        try {
            // Kiểm tra consultant có tồn tại không
            const consultant = await Consultant.findById(consultantId);
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            const scheduleDate = new Date(date);

            // Lấy schedule của consultant cho ngày đó
            const schedule = await ConsultantScheduleRepository.findByConsultantAndDate(
                consultantId,
                scheduleDate
            );

            if (!schedule || !schedule.is_available) {
                return {
                    success: true,
                    message: 'No available schedule for this date',
                    data: {
                        date,
                        consultant_id: consultantId,
                        available_slots: [],
                        total_slots: 0
                    },
                    timestamp: new Date().toISOString()
                };
            }

            // Tính toán các slot 2 giờ
            const timeSlots = this.calculateTimeSlots(
                schedule.start_time,
                schedule.end_time,
                schedule.break_start,
                schedule.break_end
            );

            // TODO: Kiểm tra các slot đã được đặt lịch và đánh dấu không available
            // Hiện tại tất cả slot đều available
            const availableSlots: TimeSlot[] = timeSlots.map(slot => ({
                ...slot,
                is_available: true
            }));

            return {
                success: true,
                message: 'Available time slots retrieved successfully',
                data: {
                    date,
                    consultant_id: consultantId,
                    available_slots: availableSlots,
                    total_slots: availableSlots.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get available time slots service error:', error);
            return {
                success: false,
                message: 'Internal server error when getting available time slots'
            };
        }
    }

    /**
     * Tính toán các slot thời gian 2 giờ
     */
    private static calculateTimeSlots(
        startTime: string,
        endTime: string,
        breakStart?: string,
        breakEnd?: string
    ): Omit<TimeSlot, 'is_available'>[] {
        const slots: Omit<TimeSlot, 'is_available'>[] = [];
        const slotDuration = 120; // 2 hours in minutes

        // Chuyển đổi time string thành minutes
        const parseTime = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Chuyển đổi minutes thành time string
        const formatTime = (minutes: number): string => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const startMinutes = parseTime(startTime);
        const endMinutes = parseTime(endTime);
        const breakStartMinutes = breakStart ? parseTime(breakStart) : null;
        const breakEndMinutes = breakEnd ? parseTime(breakEnd) : null;

        let currentTime = startMinutes;

        while (currentTime + slotDuration <= endMinutes) {
            const slotEndTime = currentTime + slotDuration;

            // Kiểm tra slot có bị overlap với break time không
            let isValidSlot = true;
            if (breakStartMinutes !== null && breakEndMinutes !== null) {
                // Slot overlap với break time nếu:
                // - Slot bắt đầu trước break end và kết thúc sau break start
                if (currentTime < breakEndMinutes && slotEndTime > breakStartMinutes) {
                    isValidSlot = false;
                }
            }

            if (isValidSlot) {
                slots.push({
                    start_time: formatTime(currentTime),
                    end_time: formatTime(slotEndTime)
                });
            }

            // Di chuyển đến slot tiếp theo
            // Nếu currentTime đang trong break time, skip đến sau break
            if (breakStartMinutes !== null && breakEndMinutes !== null &&
                currentTime < breakEndMinutes && currentTime + slotDuration > breakStartMinutes) {
                currentTime = breakEndMinutes;
            } else {
                currentTime += slotDuration;
            }
        }

        return slots;
    }

    /**
     * Lấy thông tin consultant từ user_id
     */
    public static async getConsultantByUserId(userId: string) {
        try {
            return await Consultant.findOne({ user_id: userId });
        } catch (error) {
            console.error('Error getting consultant by user id:', error);
            return null;
        }
    }

    /**
     * Lấy danh sách tất cả consultants (cho staff/admin tạo schedule)
     */
    public static async getAllConsultants() {
        try {
            return await Consultant.find()
                .populate('user_id', 'full_name email')
                .lean();
        } catch (error) {
            console.error('Error getting all consultants:', error);
            return [];
        }
    }
}