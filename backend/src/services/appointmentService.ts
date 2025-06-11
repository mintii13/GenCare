import { AppointmentRepository } from '../repositories/appointmentRepository';
import { WeeklyScheduleRepository } from '../repositories/weeklyScheduleRepository';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { IAppointment } from '../models/Appointment';
import mongoose from 'mongoose';

interface AppointmentResponse {
    success: boolean;
    message: string;
    data?: {
        appointment?: any;
        appointments?: any[];
        total?: number;
        stats?: any;
    };
    timestamp?: string;
}

export class AppointmentService {
    /**
     * Book appointment
     */
    public static async bookAppointment(appointmentData: {
        customer_id: string;
        consultant_id: string;
        appointment_date: Date;
        start_time: string;
        end_time: string;
        customer_notes?: string;
    }): Promise<AppointmentResponse> {
        try {
            // Kiểm tra customer exists
            const customer = await User.findById(appointmentData.customer_id);
            if (!customer || customer.role !== 'customer') {
                return {
                    success: false,
                    message: 'Customer not found'
                };
            }

            // Kiểm tra consultant exists
            const consultant = await Consultant.findById(appointmentData.consultant_id);
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Kiểm tra consultant có available trong ngày đó không
            const schedule = await WeeklyScheduleRepository.findByConsultantAndDate(
                appointmentData.consultant_id,
                appointmentData.appointment_date
            );

            if (!schedule) {
                return {
                    success: false,
                    message: 'Consultant is not available on this date - no schedule found'
                };
            }

            const dayOfWeek = appointmentData.appointment_date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const workingDay = schedule.working_days[dayOfWeek as keyof typeof schedule.working_days];

            if (!workingDay || !workingDay.is_available) {
                return {
                    success: false,
                    message: 'Consultant is not available on this day'
                };
            }

            // Kiểm tra thời gian book có trong working hours không
            const isValidTime = this.isTimeWithinWorkingHours(
                appointmentData.start_time,
                appointmentData.end_time,
                workingDay.start_time,
                workingDay.end_time,
                workingDay.break_start,
                workingDay.break_end
            );

            if (!isValidTime) {
                return {
                    success: false,
                    message: 'Appointment time is outside working hours or during break time'
                };
            }

            // Kiểm tra time conflict với appointments khác
            const hasConflict = await AppointmentRepository.checkTimeConflict(
                appointmentData.consultant_id,
                appointmentData.appointment_date,
                appointmentData.start_time,
                appointmentData.end_time
            );

            if (hasConflict) {
                return {
                    success: false,
                    message: 'Time slot is already booked'
                };
            }

            // Tạo appointment với ObjectId conversion
            const newAppointment = await AppointmentRepository.create({
                customer_id: new mongoose.Types.ObjectId(appointmentData.customer_id),
                consultant_id: new mongoose.Types.ObjectId(appointmentData.consultant_id),
                appointment_date: appointmentData.appointment_date,
                start_time: appointmentData.start_time,
                end_time: appointmentData.end_time,
                customer_notes: appointmentData.customer_notes,
                status: 'pending',
                created_date: new Date(),
                updated_date: new Date()
            });

            // Populate thông tin để trả về
            const populatedAppointment = await AppointmentRepository.findById(newAppointment._id.toString());

            return {
                success: true,
                message: 'Appointment booked successfully',
                data: {
                    appointment: populatedAppointment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Book appointment service error:', error);
            return {
                success: false,
                message: 'Internal server error when booking appointment'
            };
        }
    }

    /**
     * Get customer's appointments
     */
    public static async getCustomerAppointments(
        customerId: string,
        status?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<AppointmentResponse> {
        try {
            const appointments = await AppointmentRepository.findByCustomerId(
                customerId,
                status,
                startDate,
                endDate
            );

            return {
                success: true,
                message: 'Customer appointments retrieved successfully',
                data: {
                    appointments,
                    total: appointments.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get customer appointments service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving appointments'
            };
        }
    }

    /**
     * Get consultant's appointments
     */
    public static async getConsultantAppointments(
        consultantId: string,
        status?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<AppointmentResponse> {
        try {
            const appointments = await AppointmentRepository.findByConsultantId(
                consultantId,
                status,
                startDate,
                endDate
            );

            return {
                success: true,
                message: 'Consultant appointments retrieved successfully',
                data: {
                    appointments,
                    total: appointments.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get consultant appointments service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving appointments'
            };
        }
    }

    /**
     * Get appointment by ID
     */
    public static async getAppointmentById(appointmentId: string): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);

            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            return {
                success: true,
                message: 'Appointment retrieved successfully',
                data: {
                    appointment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get appointment by id service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving appointment'
            };
        }
    }

    /**
     * Update appointment
     */
    public static async updateAppointment(
        appointmentId: string,
        updateData: Partial<IAppointment>,
        requestUserId: string,
        requestUserRole: string
    ): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            // Kiểm tra quyền update
            const canUpdate = this.canUserModifyAppointment(appointment, requestUserId, requestUserRole);
            if (!canUpdate) {
                return {
                    success: false,
                    message: 'You do not have permission to update this appointment'
                };
            }

            // Nếu update thời gian, kiểm tra conflict
            if (updateData.start_time || updateData.end_time || updateData.appointment_date) {
                const newStartTime = updateData.start_time || appointment.start_time;
                const newEndTime = updateData.end_time || appointment.end_time;
                const newDate = updateData.appointment_date || appointment.appointment_date;

                const hasConflict = await AppointmentRepository.checkTimeConflict(
                    appointment.consultant_id.toString(),
                    newDate,
                    newStartTime,
                    newEndTime,
                    appointmentId
                );

                if (hasConflict) {
                    return {
                        success: false,
                        message: 'Time slot conflict with existing appointment'
                    };
                }
            }

            const updatedAppointment = await AppointmentRepository.updateById(
                appointmentId,
                updateData
            );

            return {
                success: true,
                message: 'Appointment updated successfully',
                data: {
                    appointment: updatedAppointment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update appointment service error:', error);
            return {
                success: false,
                message: 'Internal server error when updating appointment'
            };
        }
    }

    /**
     * Cancel appointment
     */
    public static async cancelAppointment(
        appointmentId: string,
        requestUserId: string,
        requestUserRole?: string
    ): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            if (appointment.status === 'cancelled') {
                return {
                    success: false,
                    message: 'Appointment is already cancelled'
                };
            }

            if (appointment.status === 'completed') {
                return {
                    success: false,
                    message: 'Cannot cancel completed appointment'
                };
            }

            // Kiểm tra quyền cancel
            const canCancel = this.canUserModifyAppointment(appointment, requestUserId, requestUserRole);
            if (!canCancel) {
                return {
                    success: false,
                    message: 'You do not have permission to cancel this appointment'
                };
            }

            const cancelledAppointment = await AppointmentRepository.cancelById(appointmentId);

            return {
                success: true,
                message: 'Appointment cancelled successfully',
                data: {
                    appointment: cancelledAppointment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Cancel appointment service error:', error);
            return {
                success: false,
                message: 'Internal server error when cancelling appointment'
            };
        }
    }

    /**
     * Confirm appointment (consultant only)
     */
    public static async confirmAppointment(
        appointmentId: string,
        consultantUserId: string
    ): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            if (appointment.status !== 'pending') {
                return {
                    success: false,
                    message: 'Only pending appointments can be confirmed'
                };
            }

            // Kiểm tra consultant có quyền confirm không
            const consultant = await Consultant.findById(appointment.consultant_id);
            if (!consultant || consultant.user_id.toString() !== consultantUserId) {
                return {
                    success: false,
                    message: 'You can only confirm your own appointments'
                };
            }

            const confirmedAppointment = await AppointmentRepository.confirmById(appointmentId);

            return {
                success: true,
                message: 'Appointment confirmed successfully',
                data: {
                    appointment: confirmedAppointment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Confirm appointment service error:', error);
            return {
                success: false,
                message: 'Internal server error when confirming appointment'
            };
        }
    }

    /**
     * Complete appointment (consultant only)
     */
    public static async completeAppointment(
        appointmentId: string,
        consultantUserId: string,
        consultantNotes?: string
    ): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            if (appointment.status !== 'confirmed') {
                return {
                    success: false,
                    message: 'Only confirmed appointments can be completed'
                };
            }

            // Kiểm tra consultant có quyền complete không
            const consultant = await Consultant.findById(appointment.consultant_id);
            if (!consultant || consultant.user_id.toString() !== consultantUserId) {
                return {
                    success: false,
                    message: 'You can only complete your own appointments'
                };
            }

            const completedAppointment = await AppointmentRepository.completeById(
                appointmentId,
                consultantNotes
            );

            return {
                success: true,
                message: 'Appointment completed successfully',
                data: {
                    appointment: completedAppointment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Complete appointment service error:', error);
            return {
                success: false,
                message: 'Internal server error when completing appointment'
            };
        }
    }

    /**
     * Get all appointments (admin/staff only)
     */
    public static async getAllAppointments(
        status?: string,
        startDate?: Date,
        endDate?: Date,
        consultantId?: string,
        customerId?: string
    ): Promise<AppointmentResponse> {
        try {
            const appointments = await AppointmentRepository.findAll(
                status,
                startDate,
                endDate,
                consultantId,
                customerId
            );

            return {
                success: true,
                message: 'All appointments retrieved successfully',
                data: {
                    appointments,
                    total: appointments.length
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get all appointments service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving appointments'
            };
        }
    }

    /**
     * Get appointment statistics
     */
    public static async getAppointmentStats(
        consultantId?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<AppointmentResponse> {
        try {
            const statusCounts = await AppointmentRepository.countByStatus(
                consultantId,
                startDate,
                endDate
            );

            const stats = {
                total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
                pending: statusCounts.pending || 0,
                confirmed: statusCounts.confirmed || 0,
                completed: statusCounts.completed || 0,
                cancelled: statusCounts.cancelled || 0
            };

            return {
                success: true,
                message: 'Appointment statistics retrieved successfully',
                data: {
                    stats
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get appointment stats service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving statistics'
            };
        }
    }

    /**
     * Reschedule appointment
     */
    public static async rescheduleAppointment(
        appointmentId: string,
        newDate: Date,
        newStartTime: string,
        newEndTime: string,
        requestUserId: string,
        requestUserRole: string
    ): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            if (appointment.status === 'completed' || appointment.status === 'cancelled') {
                return {
                    success: false,
                    message: 'Cannot reschedule completed or cancelled appointment'
                };
            }

            // Kiểm tra quyền reschedule
            const canReschedule = this.canUserModifyAppointment(appointment, requestUserId, requestUserRole);
            if (!canReschedule) {
                return {
                    success: false,
                    message: 'You do not have permission to reschedule this appointment'
                };
            }

            // Kiểm tra thời gian mới có available không
            const schedule = await WeeklyScheduleRepository.findByConsultantAndDate(
                appointment.consultant_id.toString(),
                newDate
            );

            if (!schedule) {
                return {
                    success: false,
                    message: 'Consultant is not available on the new date'
                };
            }

            const dayOfWeek = newDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const workingDay = schedule.working_days[dayOfWeek as keyof typeof schedule.working_days];

            if (!workingDay || !workingDay.is_available) {
                return {
                    success: false,
                    message: 'Consultant is not available on the new day'
                };
            }

            // Kiểm tra thời gian trong working hours
            const isValidTime = this.isTimeWithinWorkingHours(
                newStartTime,
                newEndTime,
                workingDay.start_time,
                workingDay.end_time,
                workingDay.break_start,
                workingDay.break_end
            );

            if (!isValidTime) {
                return {
                    success: false,
                    message: 'New time is outside working hours or during break time'
                };
            }

            // Kiểm tra conflict
            const hasConflict = await AppointmentRepository.checkTimeConflict(
                appointment.consultant_id.toString(),
                newDate,
                newStartTime,
                newEndTime,
                appointmentId
            );

            if (hasConflict) {
                return {
                    success: false,
                    message: 'New time slot is already booked'
                };
            }

            // Update appointment
            const updateData: Partial<IAppointment> = {
                appointment_date: newDate,
                start_time: newStartTime,
                end_time: newEndTime,
                status: 'pending' // Reset to pending when rescheduled
            };

            const rescheduledAppointment = await AppointmentRepository.updateById(
                appointmentId,
                updateData
            );

            return {
                success: true,
                message: 'Appointment rescheduled successfully',
                data: {
                    appointment: rescheduledAppointment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Reschedule appointment service error:', error);
            return {
                success: false,
                message: 'Internal server error when rescheduling appointment'
            };
        }
    }

    /**
     * Helper: Check if user can modify appointment
     */
    private static canUserModifyAppointment(
        appointment: any,
        userId: string,
        userRole?: string
    ): boolean {
        // Customer can modify their own appointments
        if (appointment.customer_id.toString() === userId) {
            return true;
        }

        // Consultant can modify appointments assigned to them
        if (appointment.consultant_id && appointment.consultant_id.user_id) {
            if (appointment.consultant_id.user_id.toString() === userId) {
                return true;
            }
        }

        // Staff and admin can modify any appointment
        if (userRole === 'staff' || userRole === 'admin') {
            return true;
        }

        return false;
    }

    /**
     * Helper: Check if time is within working hours
     */
    private static isTimeWithinWorkingHours(
        startTime: string,
        endTime: string,
        workingStart: string,
        workingEnd: string,
        breakStart?: string,
        breakEnd?: string
    ): boolean {
        const parseTime = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const appointmentStart = parseTime(startTime);
        const appointmentEnd = parseTime(endTime);
        const workStart = parseTime(workingStart);
        const workEnd = parseTime(workingEnd);

        // Check if appointment is within working hours
        if (appointmentStart < workStart || appointmentEnd > workEnd) {
            return false;
        }

        // Check if appointment conflicts with break time
        if (breakStart && breakEnd) {
            const breakStartMinutes = parseTime(breakStart);
            const breakEndMinutes = parseTime(breakEnd);

            // Check if appointment overlaps with break
            if (appointmentStart < breakEndMinutes && appointmentEnd > breakStartMinutes) {
                return false;
            }
        }

        return true;
    }
}