import { AppointmentRepository } from '../repositories/appointmentRepository';
import { WeeklyScheduleRepository } from '../repositories/weeklyScheduleRepository';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { IAppointment } from '../models/Appointment';
import mongoose from 'mongoose';
import { AppointmentHistoryService } from './appointmentHistoryService';
import { GoogleMeetService } from './googleMeetService';
import { EmailNotificationService } from './emailNotificationService';

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
            const consultant = await Consultant.findById(appointmentData.consultant_id).populate('user_id', 'full_name email');
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
                video_call_status: 'not_started',
                created_date: new Date(),
                updated_date: new Date()
            });

            // Populate thông tin để trả về
            const populatedAppointment = await AppointmentRepository.findById(newAppointment._id.toString());

            return {
                success: true,
                message: 'Appointment booked successfully. Waiting for consultant confirmation.',
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
     * ENHANCED: Confirm appointment với meeting link generation và appointment history logging
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

            // Store old data for history
            const oldData = { ...appointment };

            // Kiểm tra consultant có quyền confirm không
            const consultant = await Consultant.findById(appointment.consultant_id).populate('user_id', 'full_name email');
            if (!consultant || consultant.user_id._id.toString() !== consultantUserId) {
                return {
                    success: false,
                    message: 'You can only confirm your own appointments'
                };
            }

            // Generate Google Meet link
            const meetingDetails = GoogleMeetService.generateMeetLink();

            // Update appointment với meeting info
            const updateData = {
                status: 'confirmed' as const,
                meeting_info: {
                    meet_url: meetingDetails.meet_url,
                    meeting_id: meetingDetails.meeting_id,
                    meeting_password: meetingDetails.meeting_password,
                    created_at: new Date(),
                    reminder_sent: false
                }
            };

            const confirmedAppointment = await AppointmentRepository.updateById(appointmentId, updateData);

            if (!confirmedAppointment) {
                return {
                    success: false,
                    message: 'Failed to confirm appointment'
                };
            }

            // Log appointment history
            try {
                await AppointmentHistoryService.logAppointmentConfirmed(
                    appointmentId,
                    oldData,
                    confirmedAppointment,
                    consultantUserId,
                    'consultant'
                );
            } catch (historyError) {
                console.error('History logging error:', historyError);
            }

            // Get customer info để gửi email
            const customer = await User.findById(appointment.customer_id);
            if (customer) {
                // Prepare email data
                const emailData = {
                    customerName: customer.full_name,
                    customerEmail: customer.email,
                    consultantName: (consultant.user_id as any).full_name,
                    appointmentDate: appointment.appointment_date.toLocaleDateString('vi-VN'),
                    startTime: appointment.start_time,
                    endTime: appointment.end_time,
                    meetingInfo: {
                        meet_url: meetingDetails.meet_url,
                        meeting_id: meetingDetails.meeting_id,
                        meeting_password: meetingDetails.meeting_password
                    },
                    appointmentId: appointmentId,
                    customerNotes: appointment.customer_notes
                };

                // Send confirmation email (non-blocking)
                EmailNotificationService.sendAppointmentConfirmation(emailData)
                    .then(result => {
                        if (result.success) {
                            console.log('Confirmation email sent successfully');
                        } else {
                            console.error('Failed to send confirmation email:', result.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error sending confirmation email:', error);
                    });
            }

            return {
                success: true,
                message: 'Appointment confirmed successfully and meeting link has been sent to customer',
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
     * ENHANCED: Cancel appointment với email notification và appointment history logging
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

            // Store old data for history
            const oldData = { ...appointment };

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

            // Get user info để xác định ai hủy
            const requestUser = await User.findById(requestUserId);
            let cancelledBy = 'Unknown';

            if (requestUser) {
                if (requestUser.role === 'customer') {
                    cancelledBy = 'Khách hàng';
                } else if (requestUser.role === 'consultant') {
                    cancelledBy = 'Chuyên gia tư vấn';
                } else {
                    cancelledBy = 'Hệ thống';
                }
            }

            const cancelledAppointment = await AppointmentRepository.cancelById(appointmentId);

            if (!cancelledAppointment) {
                return {
                    success: false,
                    message: 'Failed to cancel appointment'
                };
            }

            // Log appointment history
            try {
                await AppointmentHistoryService.logAppointmentCancelled(
                    appointmentId,
                    oldData,
                    cancelledAppointment,
                    requestUserId,
                    requestUserRole || 'customer'
                );
            } catch (historyError) {
                console.error('History logging error:', historyError);
            }

            // Send cancellation email to customer
            const customer = await User.findById(appointment.customer_id);
            const consultant = await Consultant.findById(appointment.consultant_id).populate('user_id', 'full_name');

            if (customer && consultant) {
                const emailData = {
                    customerName: customer.full_name,
                    customerEmail: customer.email,
                    consultantName: (consultant.user_id as any).full_name,
                    appointmentDate: appointment.appointment_date.toLocaleDateString('vi-VN'),
                    startTime: appointment.start_time,
                    endTime: appointment.end_time,
                    appointmentId: appointmentId
                };

                // Send cancellation email (non-blocking)
                EmailNotificationService.sendAppointmentCancellation(emailData, cancelledBy)
                    .catch(error => {
                        console.error('Error sending cancellation email:', error);
                    });
            }

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

    /**
     * NEW: Send meeting reminder
     */
    public static async sendMeetingReminder(appointmentId: string): Promise<AppointmentResponse> {
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
                    message: 'Only confirmed appointments can send reminders'
                };
            }

            if (!appointment.meeting_info) {
                return {
                    success: false,
                    message: 'No meeting information found for this appointment'
                };
            }

            // Check if reminder already sent
            if (appointment.meeting_info.reminder_sent) {
                return {
                    success: false,
                    message: 'Reminder has already been sent for this appointment'
                };
            }

            // Get customer and consultant info
            const customer = await User.findById(appointment.customer_id);
            const consultant = await Consultant.findById(appointment.consultant_id).populate('user_id', 'full_name');

            if (!customer || !consultant) {
                return {
                    success: false,
                    message: 'Customer or consultant not found'
                };
            }

            const emailData = {
                customerName: customer.full_name,
                customerEmail: customer.email,
                consultantName: (consultant.user_id as any).full_name,
                appointmentDate: appointment.appointment_date.toLocaleDateString('vi-VN'),
                startTime: appointment.start_time,
                endTime: appointment.end_time,
                meetingInfo: appointment.meeting_info,
                appointmentId: appointmentId
            };

            // Send reminder email
            const emailResult = await EmailNotificationService.sendMeetingReminder(emailData, 15);

            if (emailResult.success) {
                // Mark reminder as sent - need to get current appointment and update meeting_info
                const currentAppointment = await AppointmentRepository.findById(appointmentId);
                if (currentAppointment && currentAppointment.meeting_info) {
                    const updatedMeetingInfo = {
                        ...currentAppointment.meeting_info,
                        reminder_sent: true
                    };
                    await AppointmentRepository.updateById(appointmentId, {
                        meeting_info: updatedMeetingInfo
                    });
                }

                return {
                    success: true,
                    message: 'Meeting reminder sent successfully'
                };
            } else {
                return {
                    success: false,
                    message: emailResult.message
                };
            }
        } catch (error) {
            console.error('Send meeting reminder service error:', error);
            return {
                success: false,
                message: 'Internal server error when sending reminder'
            };
        }
    }

    /**
     * UPDATED: Start meeting (update status to in_progress) với appointment history logging
     */
    public static async startMeeting(appointmentId: string, userId: string): Promise<AppointmentResponse> {
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
                    message: 'Only confirmed appointments can be started'
                };
            }

            // Store old data for history
            const oldData = { ...appointment };

            // Check if user is participant (customer or consultant)
            const isCustomer = appointment.customer_id._id.toString() === userId;
            const consultant = await Consultant.findById(appointment.consultant_id);
            const isConsultant = consultant && consultant.user_id.toString() === userId;

            if (!isCustomer && !isConsultant) {
                return {
                    success: false,
                    message: 'Only appointment participants can start the meeting'
                };
            }

            // Determine user role
            let userRole: string;
            if (isCustomer) {
                userRole = 'customer';
            } else if (isConsultant) {
                userRole = 'consultant';
            } else {
                userRole = 'customer'; // fallback
            }

            // Update status
            const updatedAppointment = await AppointmentRepository.updateById(appointmentId, {
                status: 'in_progress',
                video_call_status: 'in_progress'
            });

            if (!updatedAppointment) {
                return {
                    success: false,
                    message: 'Failed to start meeting'
                };
            }

            // Log appointment history
            try {
                await AppointmentHistoryService.logMeetingStarted(
                    appointmentId,
                    oldData,
                    updatedAppointment,
                    userId,
                    userRole
                );
            } catch (historyError) {
                console.error('History logging error:', historyError);
            }

            return {
                success: true,
                message: 'Meeting started successfully',
                data: {
                    appointment: updatedAppointment
                }
            };
        } catch (error) {
            console.error('Start meeting service error:', error);
            return {
                success: false,
                message: 'Internal server error when starting meeting'
            };
        }
    }

    /**
     * UPDATED: Complete appointment với meeting end và appointment history logging
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

            if (!['confirmed', 'in_progress'].includes(appointment.status)) {
                return {
                    success: false,
                    message: 'Only confirmed or in-progress appointments can be completed'
                };
            }

            // Store old data for history
            const oldData = { ...appointment };

            // Kiểm tra consultant có quyền complete không
            const consultant = await Consultant.findOne({ user_id: consultantUserId });
            if (!consultant || appointment.consultant_id._id.toString() !== consultant._id.toString()) {
                return {
                    success: false,
                    message: 'You can only complete your own appointments'
                };
            }

            const updateData: any = {
                status: 'completed',
                video_call_status: 'ended'
            };

            if (consultantNotes) {
                updateData.consultant_notes = consultantNotes;
            }

            const completedAppointment = await AppointmentRepository.updateById(
                appointmentId,
                updateData
            );

            if (!completedAppointment) {
                return {
                    success: false,
                    message: 'Failed to complete appointment'
                };
            }

            // Log appointment history
            try {
                await AppointmentHistoryService.logAppointmentCompleted(
                    appointmentId,
                    oldData,
                    completedAppointment,
                    consultantUserId,
                    'consultant'
                );
            } catch (historyError) {
                console.error('History logging error:', historyError);
            }

            return {
                success: true,
                message: 'Appointment completed successfully. Customer can now provide feedback.',
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
     * UNIFIED UPDATE: Handles all types of updates with meeting link logic
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

            // Permission checking
            const canUpdate = await this.canUserModifyAppointment(appointment, requestUserId, requestUserRole);
            if (!canUpdate) {
                return {
                    success: false,
                    message: 'You do not have permission to update this appointment'
                };
            }

            // BUSINESS RULE: Customer restrictions
            if (requestUserRole === 'customer') {
                const allowedFields = ['customer_notes', 'status'];
                const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));

                if (invalidFields.length > 0) {
                    return {
                        success: false,
                        message: `Customers can only update: customer_notes and status (to cancel). Invalid fields: ${invalidFields.join(', ')}`
                    };
                }

                if (updateData.status && updateData.status !== 'cancelled') {
                    return {
                        success: false,
                        message: 'Customers can only change status to cancelled'
                    };
                }

                if (updateData.status === 'cancelled') {
                    const cancelValidation = this.validateCancellationTime(appointment, requestUserRole);
                    if (!cancelValidation.success) {
                        return cancelValidation;
                    }
                }
            }

            // Check for actual changes
            const hasChanges = this.hasActualChanges(appointment, updateData);
            if (!hasChanges) {
                return {
                    success: false,
                    message: 'No changes detected. Update data is identical to current appointment data.'
                };
            }

            // Special handling for status change to 'confirmed'
            if (updateData.status === 'confirmed' && appointment.status === 'pending') {
                // Generate meeting link when confirming
                const meetingDetails = GoogleMeetService.generateMeetLink();
                updateData.meeting_info = {
                    meet_url: meetingDetails.meet_url,
                    meeting_id: meetingDetails.meeting_id,
                    meeting_password: meetingDetails.meeting_password,
                    created_at: new Date(),
                    reminder_sent: false
                };
            }

            // Determine action type
            let explicitAction: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | undefined;

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
            } else if (requestUserRole !== 'customer' && this.isTimeBeingUpdated(updateData, appointment)) {
                explicitAction = 'rescheduled';
            }

            // Time validation for non-customers
            if (requestUserRole !== 'customer' && this.isTimeBeingUpdated(updateData, appointment)) {
                try {
                    const validationResult = await this.validateTimeUpdate(
                        updateData,
                        appointment,
                        appointmentId,
                        requestUserRole
                    );

                    if (!validationResult.success) {
                        return validationResult;
                    }
                } catch (validationError) {
                    return {
                        success: false,
                        message: `Time validation failed: ${validationError.message}`
                    };
                }
            }

            // Store old data for history
            const oldData = { ...appointment };

            // Perform update
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

            // Send email notification for confirmation
            if (explicitAction === 'confirmed' && updateData.meeting_info) {
                try {
                    const customer = await User.findById(appointment.customer_id);
                    const consultant = await Consultant.findById(appointment.consultant_id).populate('user_id', 'full_name');

                    if (customer && consultant) {
                        const emailData = {
                            customerName: customer.full_name,
                            customerEmail: customer.email,
                            consultantName: (consultant.user_id as any).full_name,
                            appointmentDate: appointment.appointment_date.toLocaleDateString('vi-VN'),
                            startTime: appointment.start_time,
                            endTime: appointment.end_time,
                            meetingInfo: updateData.meeting_info,
                            appointmentId: appointmentId,
                            customerNotes: appointment.customer_notes
                        };

                        EmailNotificationService.sendAppointmentConfirmation(emailData)
                            .catch(error => console.error('Error sending confirmation email:', error));
                    }
                } catch (error) {
                    console.error('Error preparing confirmation email:', error);
                }
            }

            // Log history
            try {
                await AppointmentHistoryService.logAppointmentUpdated(
                    appointmentId,
                    oldData,
                    updatedAppointment,
                    requestUserId,
                    requestUserRole,
                    explicitAction
                );
            } catch (historyError) {
                console.error('History logging error:', historyError);
            }

            // Determine success message
            let message = 'Appointment updated successfully';
            if (explicitAction === 'rescheduled') {
                message = 'Appointment rescheduled successfully';
            } else if (explicitAction === 'confirmed') {
                message = 'Appointment confirmed successfully and meeting link has been sent to customer';
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
                cancelled: statusCounts.cancelled || 0,
                in_progress: statusCounts.in_progress || 0
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
     * Helper: Validate if there are actual changes between old and new data
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