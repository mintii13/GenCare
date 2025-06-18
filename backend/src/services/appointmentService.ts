import { AppointmentRepository } from '../repositories/appointmentRepository';
import { WeeklyScheduleRepository } from '../repositories/weeklyScheduleRepository';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { IAppointment } from '../models/Appointment';
import mongoose from 'mongoose';
import { AppointmentHistoryService } from './appointmentHistoryService';

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
     * Book appointment với business rules
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
            console.log('=== BOOKING APPOINTMENT DEBUG ===');
            console.log('Input data:', appointmentData);

            // BUSINESS RULE 1: Check if customer already has pending appointment
            const existingPending = await AppointmentRepository.findByCustomerId(
                appointmentData.customer_id,
                'pending'
            );

            if (existingPending.length > 0) {
                return {
                    success: false,
                    message: 'You already have a pending appointment. Please wait for confirmation or cancel the existing one before booking new appointment.'
                };
            }

            // BUSINESS RULE 2: Validate 2-hour lead time
            const now = new Date();
            const [hours, minutes] = appointmentData.start_time.split(':').map(Number);
            const appointmentDateTime = new Date(appointmentData.appointment_date);
            appointmentDateTime.setHours(hours, minutes, 0, 0);

            const diffMs = appointmentDateTime.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 2) {
                return {
                    success: false,
                    message: `Appointment must be booked at least 2 hours in advance. Current difference: ${diffHours.toFixed(2)} hours`
                };
            }

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

            // Tạo appointment
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
     * UNIFIED UPDATE: Handles all types of updates (notes, time, status)
     * FIXED: Better permission checking for customers and consultants
     */
    public static async updateAppointment(
        appointmentId: string,
        updateData: Partial<IAppointment>,
        requestUserId: string,
        requestUserRole: string
    ): Promise<AppointmentResponse> {
        try {
            console.log('=== UPDATE APPOINTMENT DEBUG ===');
            console.log('Appointment ID:', appointmentId);
            console.log('Update data:', updateData);
            console.log('User ID:', requestUserId);
            console.log('User role:', requestUserRole);

            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            console.log('Current appointment:', appointment);

            // FIXED: Improved permission checking
            const canUpdate = await this.canUserModifyAppointment(appointment, requestUserId, requestUserRole);
            if (!canUpdate) {
                return {
                    success: false,
                    message: 'You do not have permission to update this appointment'
                };
            }

            // BUSINESS RULE: Customer chỉ được update notes và cancel appointment (status = 'cancelled')
            if (requestUserRole === 'customer') {
                const allowedFields = ['customer_notes', 'status'];
                const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));

                if (invalidFields.length > 0) {
                    return {
                        success: false,
                        message: `Customers can only update: customer_notes and status (to cancel). Invalid fields: ${invalidFields.join(', ')}`
                    };
                }

                // Customer chỉ có thể change status thành 'cancelled'
                if (updateData.status && updateData.status !== 'cancelled') {
                    return {
                        success: false,
                        message: 'Customers can only change status to cancelled'
                    };
                }

                // Kiểm tra business rule cho việc cancel (4 giờ trước)
                if (updateData.status === 'cancelled') {
                    const cancelValidation = this.validateCancellationTime(appointment, requestUserRole);
                    if (!cancelValidation.success) {
                        return cancelValidation;
                    }
                }
            }

            // NEW: Validate if there are any actual changes
            const hasChanges = this.hasActualChanges(appointment, updateData);
            if (!hasChanges) {
                return {
                    success: false,
                    message: 'No changes detected. Update data is identical to current appointment data.'
                };
            }

            // Determine action type trước khi update
            let explicitAction: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | undefined;

            // 1. Ưu tiên cao nhất: thay đổi status
            if (updateData.status && updateData.status !== appointment.status) {
                switch (updateData.status) {
                    case 'confirmed':
                        explicitAction = 'confirmed';
                        break;
                    case 'cancelled':
                        explicitAction = 'cancelled';
                        break;
                    case 'completed':
                        explicitAction = 'completed';
                        break;
                }
            }
            // 2. Ưu tiên trung bình: thay đổi thời gian (chỉ cho consultant, staff, admin)
            else if (requestUserRole !== 'customer' && this.isTimeBeingUpdated(updateData, appointment)) {
                explicitAction = 'rescheduled';
            }
            // 3. Mặc định: 'updated' cho các thay đổi khác

            console.log('Explicit action determined:', explicitAction);

            // Validation cho thay đổi thời gian - chỉ khi có time change và không phải customer
            if (requestUserRole !== 'customer' && this.isTimeBeingUpdated(updateData, appointment)) {
                console.log('Time is being updated, validating...');

                try {
                    const validationResult = await this.validateTimeUpdate(
                        updateData,
                        appointment,
                        appointmentId,
                        requestUserRole
                    );

                    if (!validationResult.success) {
                        console.log('Time validation failed:', validationResult.message);
                        return validationResult;
                    }
                    console.log('Time validation passed');
                } catch (validationError) {
                    console.error('Time validation error:', validationError);
                    return {
                        success: false,
                        message: `Time validation failed: ${validationError.message}`
                    };
                }
            }

            // Store old data for history
            const oldData = { ...appointment };

            // Perform update
            console.log('Performing update...');
            const updatedAppointment = await AppointmentRepository.updateById(
                appointmentId,
                updateData
            );

            if (!updatedAppointment) {
                return {
                    success: false,
                    message: 'Failed to update appointment'
                };
            }

            console.log('Update successful, logging history...');

            // Log history với action chính xác
            try {
                await AppointmentHistoryService.logAppointmentUpdated(
                    appointmentId,
                    oldData,
                    updatedAppointment,
                    requestUserId,
                    requestUserRole,
                    explicitAction
                );
                console.log('History logged successfully');
            } catch (historyError) {
                console.error('History logging error:', historyError);
                // Continue even if history logging fails
            }

            // Determine success message based on action
            let message = 'Appointment updated successfully';
            if (explicitAction === 'rescheduled') {
                message = 'Appointment rescheduled successfully';
            } else if (explicitAction === 'confirmed') {
                message = 'Appointment confirmed successfully';
            } else if (explicitAction === 'cancelled') {
                message = 'Appointment cancelled successfully';
            } else if (explicitAction === 'completed') {
                message = 'Appointment completed successfully';
            }

            return {
                success: true,
                message,
                data: {
                    appointment: updatedAppointment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update appointment service error:', error);
            return {
                success: false,
                message: `Internal server error when updating appointment: ${error.message}`
            };
        }
    }

    /**
     * NEW: Validate cancellation time business rule
     */
    private static validateCancellationTime(
        appointment: any,
        userRole: string
    ): AppointmentResponse {
        // Staff và Admin có thể cancel bất cứ lúc nào
        if (userRole === 'staff' || userRole === 'admin') {
            return { success: true, message: 'Cancellation allowed for staff/admin' };
        }

        // BUSINESS RULE: Hủy lịch trước 4 tiếng
        const now = new Date();
        const appointmentDateTime = new Date(`${appointment.appointment_date.toISOString().split('T')[0]} ${appointment.start_time}:00`);
        const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 4) {
            return {
                success: false,
                message: 'Appointment can only be cancelled at least 4 hours before the scheduled time'
            };
        }

        return { success: true, message: 'Cancellation time validation passed' };
    }

    /**
     * NEW: Validate if there are actual changes between old and new data
     */
    private static hasActualChanges(currentAppointment: any, updateData: Partial<IAppointment>): boolean {
        // Compare each field in updateData with current values
        for (const [key, newValue] of Object.entries(updateData)) {
            const currentValue = currentAppointment[key];

            // Special handling for dates
            if (key === 'appointment_date') {
                const currentDateStr = new Date(currentValue).toISOString().split('T')[0];
                const newDateStr = new Date(newValue as Date).toISOString().split('T')[0];
                if (currentDateStr !== newDateStr) {
                    return true;
                }
            }
            // Regular field comparison
            else if (currentValue !== newValue) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extracted time validation logic với improved error handling
     */
    private static async validateTimeUpdate(
        updateData: Partial<IAppointment>,
        appointment: any,
        appointmentId: string,
        requestUserRole: string
    ): Promise<AppointmentResponse> {
        try {
            const newStartTime = updateData.start_time || appointment.start_time;
            const newEndTime = updateData.end_time || appointment.end_time;
            const newDate = updateData.appointment_date || appointment.appointment_date;

            console.log('Validating time update:', {
                newStartTime,
                newEndTime,
                newDate: new Date(newDate).toISOString().split('T')[0]
            });

            // BUSINESS RULE: 2-hour lead time cho việc update thời gian
            const now = new Date();
            const newAppointmentDateTime = new Date(newDate);
            const [hours, minutes] = newStartTime.split(':').map(Number);
            newAppointmentDateTime.setHours(hours, minutes, 0, 0);

            const diffHours = (newAppointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            console.log('Time check:', {
                now: now.toISOString(),
                appointmentDateTime: newAppointmentDateTime.toISOString(),
                diffHours
            });

            // Staff và Admin có thể update bất cứ lúc nào
            if (requestUserRole !== 'staff' && requestUserRole !== 'admin' && diffHours < 2) {
                return {
                    success: false,
                    message: 'Appointment time can only be updated to at least 2 hours from now'
                };
            }

            // Kiểm tra consultant có available không
            console.log('Finding consultant schedule...');

            let consultantId: string;

            // Lấy consultant ID từ appointment (có thể là populated object hoặc ObjectId)
            if (typeof appointment.consultant_id === 'string') {
                consultantId = appointment.consultant_id;
            } else if (appointment.consultant_id._id) {
                consultantId = appointment.consultant_id._id.toString();
            } else {
                consultantId = appointment.consultant_id.toString();
            }

            console.log('Consultant ID:', consultantId);

            const schedule = await WeeklyScheduleRepository.findByConsultantAndDate(
                consultantId,
                newDate
            );

            console.log('Schedule found:', !!schedule);

            if (!schedule) {
                return {
                    success: false,
                    message: 'Consultant is not available on the new date - no schedule found'
                };
            }

            const dayOfWeek = new Date(newDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const workingDay = schedule.working_days[dayOfWeek as keyof typeof schedule.working_days];

            console.log('Working day check:', {
                dayOfWeek,
                workingDay: workingDay ? {
                    start_time: workingDay.start_time,
                    end_time: workingDay.end_time,
                    is_available: workingDay.is_available
                } : null
            });

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

            console.log('Working hours check:', isValidTime);

            if (!isValidTime) {
                return {
                    success: false,
                    message: 'New time is outside working hours or during break time'
                };
            }

            // Kiểm tra time conflict
            console.log('Checking time conflicts...');
            const hasConflict = await AppointmentRepository.checkTimeConflict(
                consultantId,
                newDate,
                newStartTime,
                newEndTime,
                appointmentId
            );

            console.log('Time conflict check:', hasConflict);

            if (hasConflict) {
                return {
                    success: false,
                    message: 'Time slot conflict with existing appointment'
                };
            }

            return { success: true, message: 'Time validation passed' };

        } catch (error) {
            console.error('Time validation error:', error);
            throw new Error(`Time validation failed: ${error.message}`);
        }
    }

    /**
     * Cancel appointment với business rule 4-hour lead time
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

            // BUSINESS RULE: Hủy lịch trước 4 tiếng
            const now = new Date();
            const appointmentDateTime = new Date(`${appointment.appointment_date.toISOString().split('T')[0]} ${appointment.start_time}:00`);
            const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            // Staff và Admin có thể hủy bất cứ lúc nào
            if (requestUserRole !== 'staff' && requestUserRole !== 'admin' && diffHours < 4) {
                return {
                    success: false,
                    message: 'Appointment can only be cancelled at least 4 hours before the scheduled time'
                };
            }

            // Kiểm tra quyền cancel
            const canCancel = await this.canUserModifyAppointment(appointment, requestUserId, requestUserRole);
            if (!canCancel) {
                return {
                    success: false,
                    message: 'You do not have permission to cancel this appointment'
                };
            }

            const cancelledAppointment = await AppointmentRepository.cancelById(appointmentId);

            return {
                success: true,
                message: diffHours < 4 && (requestUserRole === 'staff' || requestUserRole === 'admin')
                    ? 'Appointment cancelled by staff/admin (less than 4 hours notice)'
                    : 'Appointment cancelled successfully',
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

    // Các method khác giữ nguyên...
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

            // Kiểm tra đã đủ 15 phút từ lúc bắt đầu buổi tư vấn chưa
            try {
                const appointmentDate = new Date(appointment.appointment_date);
                const [hours, minutes] = appointment.start_time.split(':').map(Number);
                
                if (isNaN(appointmentDate.getTime()) || isNaN(hours) || isNaN(minutes)) {
                    return {
                        success: false,
                        message: 'Invalid appointment date or time format'
                    };
                }

                const appointmentDateTime = new Date(appointmentDate);
                appointmentDateTime.setHours(hours, minutes, 0, 0);
                
                const now = new Date();
                const minutesPassed = (now.getTime() - appointmentDateTime.getTime()) / (1000 * 60);
                
                if (minutesPassed < 15) {
                    const remainingMinutes = Math.ceil(15 - minutesPassed);
                    return {
                        success: false,
                        message: `Appointment can only be completed after 15 minutes from start time. Please wait ${remainingMinutes} more minutes.`
                    };
                }
            } catch (error) {
                console.error('Error checking completion time:', error);
                return {
                    success: false,
                    message: 'Error validating completion time'
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
     * Helper: Kiểm tra có đang update thời gian không
     */
    private static isTimeBeingUpdated(updateData: Partial<IAppointment>, currentAppointment: any): boolean {
        // Kiểm tra xem có field thời gian nào trong updateData không
        if (updateData.appointment_date || updateData.start_time || updateData.end_time) {
            // So sánh với giá trị hiện tại
            const newDate = updateData.appointment_date || currentAppointment.appointment_date;
            const newStartTime = updateData.start_time || currentAppointment.start_time;
            const newEndTime = updateData.end_time || currentAppointment.end_time;

            const currentDate = new Date(currentAppointment.appointment_date).toISOString().split('T')[0];
            const updatedDate = new Date(newDate).toISOString().split('T')[0];

            return (
                currentDate !== updatedDate ||
                currentAppointment.start_time !== newStartTime ||
                currentAppointment.end_time !== newEndTime
            );
        }
        return false;
    }

    /**
     * FIXED: Improved permission checking with proper consultant lookup
     */
    private static async canUserModifyAppointment(
        appointment: any,
        userId: string,
        userRole?: string
    ): Promise<boolean> {
        try {
            // Customer can modify their own appointments
            let customerIdToCheck: string;
            if (typeof appointment.customer_id === 'string') {
                customerIdToCheck = appointment.customer_id;
            } else if (appointment.customer_id._id) {
                customerIdToCheck = appointment.customer_id._id.toString();
            } else {
                customerIdToCheck = appointment.customer_id.toString();
            }

            if (customerIdToCheck === userId) {
                return true;
            }

            // Consultant can modify appointments assigned to them
            // Need to get consultant_id from appointment and find the consultant to get user_id
            let consultantIdFromAppointment: string;
            if (typeof appointment.consultant_id === 'string') {
                consultantIdFromAppointment = appointment.consultant_id;
            } else if (appointment.consultant_id._id) {
                consultantIdFromAppointment = appointment.consultant_id._id.toString();
            } else {
                consultantIdFromAppointment = appointment.consultant_id.toString();
            }

            // Find the consultant document to get user_id
            const consultant = await Consultant.findById(consultantIdFromAppointment).lean();
            if (consultant && consultant.user_id.toString() === userId) {
                return true;
            }

            // Staff and admin can modify any appointment
            if (userRole === 'staff' || userRole === 'admin') {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking user permission:', error);
            return false;
        }
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