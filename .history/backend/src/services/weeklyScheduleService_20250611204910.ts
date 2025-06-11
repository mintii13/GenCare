import { WeeklyScheduleRepository } from '../repositories/weeklyScheduleRepository';
import { AppointmentRepository } from '../repositories/appointmentRepository';
import { Consultant } from '../models/Consultant';
import { IWeeklySchedule } from '../models/WeeklySchedule';
import { ScheduleResponse, SchedulesResponse, AvailabilityResponse, WeeklyAvailabilityResponse, TimeSlot, DaySlots } from '../dto/responses/consultantScheduleResponse';
import mongoose from 'mongoose';
export class WeeklyScheduleService {
    /**
     * Tạo weekly schedule cho một tuần cụ thể
     */
    public static async createSchedule(
        scheduleData: Partial<IWeeklySchedule> & {
            consultant_id: string;
            week_start_date: Date;
            created_by: { user_id: string, role: string, name: string }
        }
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

            // Tính week_end_date từ week_start_date
            const weekEndDate = WeeklyScheduleRepository.getWeekEndDate(scheduleData.week_start_date);

            // Kiểm tra xem tuần này đã có schedule chưa
            const existingSchedule = await WeeklyScheduleRepository.existsByConsultantAndWeek(
                scheduleData.consultant_id,
                scheduleData.week_start_date
            );

            if (existingSchedule) {
                return {
                    success: false,
                    message: 'Schedule already exists for this week'
                };
            }

            // Auto-fill missing days with default values
            const completeWorkingDays = this.fillMissingDaysWithDefaults(scheduleData.working_days || {});

            const newSchedule = await WeeklyScheduleRepository.create({
                ...scheduleData,
                week_end_date: weekEndDate,
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
     * Cập nhật weekly schedule
     */
    public static async updateSchedule(
        scheduleId: string,
        updateData: Partial<IWeeklySchedule>
    ): Promise<ScheduleResponse> {
        try {
            // Tìm existing schedule
            const existingSchedule = await WeeklyScheduleRepository.findById(scheduleId);
            if (!existingSchedule) {
                return {
                    success: false,
                    message: 'Schedule not found'
                };
            }

            // Nếu có thay đổi week_start_date, tính lại week_end_date
            let finalUpdateData = { ...updateData };
            if (updateData.week_start_date) {
                finalUpdateData.week_end_date = WeeklyScheduleRepository.getWeekEndDate(updateData.week_start_date);

                // Kiểm tra conflict với tuần mới
                const hasConflict = await WeeklyScheduleRepository.existsByConsultantAndWeek(
                    existingSchedule.consultant_id.toString(),
                    updateData.week_start_date
                );

                if (hasConflict) {
                    return {
                        success: false,
                        message: 'Schedule already exists for the new week'
                    };
                }
            }

            // Nếu có working_days trong update, merge với existing working_days
            if (updateData.working_days) {
                finalUpdateData.working_days = {
                    ...existingSchedule.working_days,
                    ...updateData.working_days
                };
            }

            const updatedSchedule = await WeeklyScheduleRepository.updateById(
                scheduleId,
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
     * Lấy schedules của consultant trong khoảng thời gian
     */
    public static async getConsultantSchedules(
        consultantId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<SchedulesResponse> {
        try {
            const schedules = await WeeklyScheduleRepository.findByConsultantIdInRange(
                consultantId,
                startDate,
                endDate
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
     * Lấy schedule cụ thể theo ID
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
     * Lấy tất cả schedules (for admin/staff)
     */
    public static async getAllSchedules(
        startDate?: Date,
        endDate?: Date,
        consultantId?: string
    ): Promise<SchedulesResponse> {
        try {
            const schedules = await WeeklyScheduleRepository.findAll(startDate, endDate, consultantId);

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
     * Xóa schedule
     */
    public static async deleteSchedule(scheduleId: string): Promise<ScheduleResponse> {
        try {
            // Tìm existing schedule
            const existingSchedule = await WeeklyScheduleRepository.findById(scheduleId);
            if (!existingSchedule) {
                return {
                    success: false,
                    message: 'Schedule not found'
                };
            }

            // Kiểm tra xem có appointments nào trong tuần này không
            const hasAppointments = await this.checkExistingAppointments(
                existingSchedule.consultant_id.toString(),
                existingSchedule.week_start_date,
                existingSchedule.week_end_date
            );

            if (hasAppointments) {
                return {
                    success: false,
                    message: 'Cannot delete schedule with existing appointments'
                };
            }

            const deletedSchedule = await WeeklyScheduleRepository.deleteById(scheduleId);
            if (!deletedSchedule) {
                return {
                    success: false,
                    message: 'Failed to delete schedule'
                };
            }

            return {
                success: true,
                message: 'Schedule deleted successfully',
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
     * NEW: Lấy available slots cho cả tuần
     */
    public static async getWeeklyAvailableSlots(
        consultantId: string,
        weekStartDate: Date
    ): Promise<WeeklyAvailabilityResponse> {
        try {
            // Tìm schedule cho tuần đó
            const schedule = await WeeklyScheduleRepository.findByConsultantAndWeek(
                consultantId,
                weekStartDate
            );

            if (!schedule) {
                return {
                    success: false,
                    message: 'No schedule found for this week'
                };
            }

            // Tính week end date
            const weekEndDate = WeeklyScheduleRepository.getWeekEndDate(weekStartDate);

            // Lấy tất cả appointments trong tuần với populated customer data
            const weekAppointments = await AppointmentRepository.findByConsultantId(
                consultantId,
                undefined, // any status
                weekStartDate,
                weekEndDate
            );

            // Filter out cancelled appointments
            const activeAppointments = weekAppointments.filter(apt => apt.status !== 'cancelled');

            // Xử lý từng ngày trong tuần
            const days: any = {};
            const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

            let totalWorkingDays = 0;
            let totalAvailableSlots = 0;
            let totalBookedSlots = 0;

            for (let i = 0; i < 7; i++) {
                const dayName = dayNames[i];
                const currentDate = new Date(weekStartDate);
                currentDate.setDate(weekStartDate.getDate() + i);

                const workingDay = schedule.working_days[dayName as keyof typeof schedule.working_days];

                if (!workingDay || !workingDay.is_available) {
                    // Ngày không làm việc
                    days[dayName] = {
                        date: currentDate.toISOString().split('T')[0],
                        day_of_week: dayName,
                        is_working_day: false,
                        available_slots: [],
                        total_slots: 0,
                        booked_appointments: []
                    };
                    continue;
                }

                totalWorkingDays++;

                // Generate slots cho ngày này
                const allSlots = this.generateTimeSlots(
                    workingDay.start_time,
                    workingDay.end_time,
                    workingDay.break_start,
                    workingDay.break_end,
                    schedule.default_slot_duration
                );

                // Lấy appointments cho ngày này
                const dayAppointments = activeAppointments.filter(apt => {
                    const aptDate = new Date(apt.appointment_date);
                    return aptDate.toDateString() === currentDate.toDateString();
                });

                // Filter available slots
                const availableSlots = allSlots.filter(slot => {
                    return !this.isSlotBooked(slot, dayAppointments);
                });

                totalAvailableSlots += availableSlots.length;
                totalBookedSlots += (allSlots.length - availableSlots.length);

                days[dayName] = {
                    date: currentDate.toISOString().split('T')[0],
                    day_of_week: dayName,
                    is_working_day: true,
                    working_hours: {
                        start_time: workingDay.start_time,
                        end_time: workingDay.end_time,
                        break_start: workingDay.break_start,
                        break_end: workingDay.break_end
                    },
                    available_slots: availableSlots,
                    total_slots: availableSlots.length,
                    booked_appointments: dayAppointments.map(apt => {
                        // Safe access to customer name
                        let customerName = 'Unknown';
                        if (apt.customer_id && typeof apt.customer_id === 'object' && 'full_name' in apt.customer_id) {
                            customerName = (apt.customer_id as any).full_name;
                        }

                        return {
                            appointment_id: apt._id.toString(),
                            start_time: apt.start_time,
                            end_time: apt.end_time,
                            status: apt.status,
                            customer_name: customerName
                        };
                    })
                };
            }

            return {
                success: true,
                message: 'Weekly available slots retrieved successfully',
                data: {
                    week_start_date: weekStartDate.toISOString().split('T')[0],
                    week_end_date: weekEndDate.toISOString().split('T')[0],
                    consultant_id: consultantId,
                    schedule_id: schedule._id.toString(),
                    days,
                    summary: {
                        total_working_days: totalWorkingDays,
                        total_available_slots: totalAvailableSlots,
                        total_booked_slots: totalBookedSlots
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get weekly available slots service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving weekly slots'
            };
        }
    }

    /**
     * UPDATED: Lấy available slots cho một ngày cụ thể (keep for backward compatibility)
     */
    public static async getAvailableSlots(
        consultantId: string,
        date: Date
    ): Promise<AvailabilityResponse> {
        try {
            // Tìm schedule cho ngày đó
            const schedule = await WeeklyScheduleRepository.findByConsultantAndDate(consultantId, date);

            if (!schedule) {
                return {
                    success: false,
                    message: 'No schedule found for this date'
                };
            }

            // Xác định thứ trong tuần
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

            // Generate tất cả time slots có thể
            const allSlots = this.generateTimeSlots(
                workingDay.start_time,
                workingDay.end_time,
                workingDay.break_start,
                workingDay.break_end,
                schedule.default_slot_duration
            );

            // Lấy appointments đã book cho ngày đó (exclude cancelled)
            const existingAppointments = await AppointmentRepository.findByConsultantAndDate(
                consultantId,
                date,
                ['cancelled'] // Exclude cancelled appointments
            );

            // Filter ra các slots đã được book
            const availableSlots = allSlots.filter(slot => {
                return !this.isSlotBooked(slot, existingAppointments);
            });

            return {
                success: true,
                message: 'Available slots retrieved successfully',
                data: {
                    date: date.toISOString().split('T')[0],
                    consultant_id: consultantId,
                    available_slots: availableSlots,
                    total_slots: availableSlots.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get available slots service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving available slots'
            };
        }
    }

    /**
     * Copy schedule từ tuần này sang tuần khác
     */
    public static async copySchedule(
        sourceScheduleId: string,
        targetWeekStartDate: Date,
        createdBy: { user_id: string, role: string, name: string }
    ): Promise<ScheduleResponse> {
        try {
            console.log('=== COPY SCHEDULE DEBUG START ===');
            console.log('Input parameters:');
            console.log('- sourceScheduleId:', sourceScheduleId);
            console.log('- targetWeekStartDate:', targetWeekStartDate);
            console.log('- createdBy:', createdBy);

            // Validate sourceScheduleId
            if (!mongoose.Types.ObjectId.isValid(sourceScheduleId)) {
                console.log('ERROR: Invalid sourceScheduleId format');
                return {
                    success: false,
                    message: 'Invalid source schedule ID format'
                };
            }

            // Step 1: Find source schedule
            console.log('Step 1: Finding source schedule...');
            const sourceSchedule = await WeeklyScheduleRepository.findById(sourceScheduleId);
            console.log('Source schedule found:', !!sourceSchedule);

            if (!sourceSchedule) {
                console.log('ERROR: Source schedule not found');
                return {
                    success: false,
                    message: 'Source schedule not found'
                };
            }

            console.log('Source schedule details:');
            console.log('- consultant_id:', sourceSchedule.consultant_id);
            console.log('- week_start_date:', sourceSchedule.week_start_date);
            console.log('- working_days keys:', Object.keys(sourceSchedule.working_days || {}));

            // Step 2: Validate target week start date
            console.log('Step 2: Validating target week start date...');
            const targetDate = new Date(targetWeekStartDate);
            const dayOfWeek = targetDate.getUTCDay();
            console.log('Target date day of week:', dayOfWeek, '(0=Sunday, 1=Monday)');

            if (dayOfWeek !== 1) {
                console.log('ERROR: Target date is not a Monday');
                return {
                    success: false,
                    message: 'Target week start date must be a Monday'
                };
            }

            // Step 3: Check if target week already has schedule
            console.log('Step 3: Checking for existing schedule in target week...');
            const existingSchedule = await WeeklyScheduleRepository.existsByConsultantAndWeek(
                sourceSchedule.consultant_id.toString(),
                targetDate
            );
            console.log('Existing schedule found:', existingSchedule);

            if (existingSchedule) {
                console.log('ERROR: Schedule already exists for target week');
                return {
                    success: false,
                    message: 'Schedule already exists for target week'
                };
            }

            // Step 4: Calculate target week end date
            console.log('Step 4: Calculating target week end date...');
            const targetWeekEndDate = WeeklyScheduleRepository.getWeekEndDate(targetDate);
            console.log('Target week end date:', targetWeekEndDate);

            // Step 5: Prepare new schedule data
            console.log('Step 5: Preparing new schedule data...');
            const newScheduleData: Partial<IWeeklySchedule> = {
                consultant_id: sourceSchedule.consultant_id,
                week_start_date: targetDate,
                week_end_date: targetWeekEndDate,
                working_days: sourceSchedule.working_days,
                default_slot_duration: sourceSchedule.default_slot_duration,
                notes: `Copied from week ${sourceSchedule.week_start_date.toISOString().split('T')[0]}`,
                created_by: {
                    user_id: new mongoose.Types.ObjectId(createdBy.user_id),
                    role: createdBy.role,
                    name: createdBy.name
                },
                created_date: new Date(),
                updated_date: new Date()
            };

            console.log('New schedule data prepared:');
            console.log('- consultant_id:', newScheduleData.consultant_id);
            console.log('- week_start_date:', newScheduleData.week_start_date);
            console.log('- week_end_date:', newScheduleData.week_end_date);
            console.log('- created_by:', newScheduleData.created_by);

            // Step 6: Create new schedule
            console.log('Step 6: Creating new schedule...');
            const newSchedule = await WeeklyScheduleRepository.create(newScheduleData);
            console.log('New schedule created successfully:', !!newSchedule);
            console.log('New schedule ID:', newSchedule?._id);

            console.log('=== COPY SCHEDULE DEBUG END ===');

            return {
                success: true,
                message: 'Schedule copied successfully',
                data: {
                    schedule: newSchedule
                },
                timestamp: new Date().toISOString()
            };

        } catch (error: any) {
            console.error('=== COPY SCHEDULE ERROR ===');
            console.error('Error details:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('=== END ERROR ===');

            return {
                success: false,
                message: `Internal server error when copying schedule: ${error.message}`
            };
        }
    }

    /**
     * Helper: Fill missing days with default values
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
                completeWorkingDays[day] = workingDays[day];
            } else {
                completeWorkingDays[day] = { ...defaultDay };
            }
        }

        return completeWorkingDays;
    }

    /**
     * Helper: Generate time slots
     */
    private static generateTimeSlots(
        startTime: string,
        endTime: string,
        breakStart?: string,
        breakEnd?: string,
        slotDuration: number = 30
    ): TimeSlot[] {
        const slots: TimeSlot[] = [];

        const parseTime = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const formatTime = (minutes: number): string => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const startMinutes = parseTime(startTime);
        const endMinutes = parseTime(endTime);

        let breakStartMinutes: number | null = null;
        let breakEndMinutes: number | null = null;

        if (breakStart && breakEnd) {
            breakStartMinutes = parseTime(breakStart);
            breakEndMinutes = parseTime(breakEnd);
        }

        let currentTime = startMinutes;

        while (currentTime + slotDuration <= endMinutes) {
            const slotEndTime = currentTime + slotDuration;

            let conflictsWithBreak = false;
            if (breakStartMinutes !== null && breakEndMinutes !== null) {
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

            if (breakStartMinutes !== null && breakEndMinutes !== null &&
                currentTime >= breakStartMinutes && currentTime < breakEndMinutes) {
                currentTime = breakEndMinutes;
            }
        }

        return slots;
    }

    /**
     * Helper: Check if slot is booked
     */
    private static isSlotBooked(slot: TimeSlot, appointments: any[]): boolean {
        return appointments.some(appointment => {
            const appointmentStart = appointment.start_time;
            const appointmentEnd = appointment.end_time;

            // Check if slot overlaps with appointment
            return (slot.start_time < appointmentEnd && slot.end_time > appointmentStart);
        });
    }

    /**
     * Helper: Check existing appointments in week
     */
    private static async checkExistingAppointments(
        consultantId: string,
        weekStart: Date,
        weekEnd: Date
    ): Promise<boolean> {
        try {
            const appointments = await AppointmentRepository.findByConsultantId(
                consultantId,
                undefined, // any status except cancelled
                weekStart,
                weekEnd
            );

            return appointments.some(appointment =>
                appointment.status !== 'cancelled'
            );
        } catch (error) {
            console.error('Error checking existing appointments:', error);
            return false;
        }
    }
}