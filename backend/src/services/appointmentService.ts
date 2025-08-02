import { AppointmentRepository } from '../repositories/appointmentRepository';
import { WeeklyScheduleRepository } from '../repositories/weeklyScheduleRepository';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { IAppointment, Appointment } from '../models/Appointment';
import mongoose from 'mongoose';
import { AppointmentHistoryService } from './appointmentHistoryService';
import { GoogleMeetService } from './googleMeetService';
import { EmailNotificationService } from './emailNotificationService';
import { FeedbackResponse, FeedbackStatsResponse } from '../dto/responses/FeedbackResponse';
import { CreateFeedbackRequest } from '../dto/requests/FeedbackRequest';
import { AppointmentResponse } from '../dto/responses/AppointmentResponse';
import { PaginationUtils } from '../utils/paginationUtils';
import { AppointmentQuery } from '../dto/requests/PaginationRequest';

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
                // Lấy thông tin appointment đang chờ xác nhận
                const pendingAppointment = existingPending[0];
                const appointmentDate = new Date(pendingAppointment.appointment_date).toLocaleDateString('vi-VN');
                const timeSlot = `${pendingAppointment.start_time} - ${pendingAppointment.end_time}`;
                
                return {
                    success: false,
                    message: `Bạn đã có một lịch hẹn đang chờ xác nhận vào ngày ${appointmentDate} (${timeSlot}). Vui lòng chờ xác nhận từ bác sĩ hoặc hủy lịch hẹn hiện tại trước khi đặt lịch mới.`,
                    errorType: 'PENDING_APPOINTMENT_EXISTS',
                    details: {
                        existingAppointment: {
                            id: pendingAppointment._id,
                            appointment_date: appointmentDate,
                            time_slot: timeSlot,
                            status: 'pending'
                        }
                    }
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
                    message: `Appointment must be booked at least 2 hours in advance. Current lead time: ${diffHours.toFixed(1)} hours.`
                };
            }

            // BUSINESS RULE: Validate notes length (TC-F1)
            if (appointmentData.customer_notes && appointmentData.customer_notes.length > 2000) {
                return {
                    success: false,
                    message: 'Ghi chú của khách hàng không được vượt quá 2000 ký tự.'
                };
            }

            // BUSINESS RULE 3: Check for time conflicts
            const hasConflict = await AppointmentRepository.checkTimeConflict(
                appointmentData.consultant_id,
                appointmentData.appointment_date,
                appointmentData.start_time,
                appointmentData.end_time
            );

            if (hasConflict) {
                return {
                    success: false,
                    message: 'The selected time slot conflicts with an existing appointment.'
                };
            }

            // BUSINESS RULE 4: Validate consultant working hours
            const consultant = await Consultant.findById(appointmentData.consultant_id).populate('user_id');
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Sử dụng method đúng từ WeeklyScheduleRepository
            const consultantSchedule = await WeeklyScheduleRepository.findByConsultantAndDate(
                appointmentData.consultant_id,
                appointmentData.appointment_date
            );

            if (consultantSchedule) {
                const dayOfWeek = appointmentData.appointment_date.getDay();
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayNames[dayOfWeek] as keyof typeof consultantSchedule.working_days;

                const daySchedule = consultantSchedule.working_days[dayName];

                if (!daySchedule || !daySchedule.is_available) {
                    return {
                        success: false,
                        message: 'Consultant is not available on this day'
                    };
                }

                const appointmentStart = appointmentData.start_time;
                const appointmentEnd = appointmentData.end_time;

                if (appointmentStart < daySchedule.start_time || appointmentEnd > daySchedule.end_time) {
                    return {
                        success: false,
                        message: `Appointment time must be within consultant working hours: ${daySchedule.start_time} - ${daySchedule.end_time}`
                    };
                }
            }

            // Create appointment - sử dụng đúng field names từ model
            const newAppointment = await AppointmentRepository.create({
                customer_id: new mongoose.Types.ObjectId(appointmentData.customer_id),
                consultant_id: new mongoose.Types.ObjectId(appointmentData.consultant_id),
                appointment_date: appointmentData.appointment_date,
                start_time: appointmentData.start_time,
                end_time: appointmentData.end_time,
                status: 'pending',
                customer_notes: appointmentData.customer_notes,
                created_date: new Date(), // Đúng field name
                updated_date: new Date()  // Đúng field name
            });

            console.log('Appointment created:', newAppointment._id);

            // THÊM: Log appointment history cho action "created"
            try {
                await AppointmentHistoryService.logAppointmentCreated(
                    newAppointment._id.toString(),
                    {
                        customer_id: appointmentData.customer_id,
                        consultant_id: appointmentData.consultant_id,
                        appointment_date: appointmentData.appointment_date,
                        start_time: appointmentData.start_time,
                        end_time: appointmentData.end_time,
                        customer_notes: appointmentData.customer_notes,
                        status: 'pending',
                        created_date: new Date(),
                        updated_date: new Date()
                    },
                    appointmentData.customer_id,
                    'customer'
                );
                console.log(' Appointment history created successfully for:', newAppointment._id);
            } catch (historyError) {
                console.error(' Failed to create appointment history:', historyError);
                // Don't fail the appointment creation if history logging fails
            }

            // Populate for response
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
     * ENHANCED: Confirm appointment với REAL Google Meet generation
     */
    public static async confirmAppointment(
        appointmentId: string,
        consultantUserId: string,
        googleAccessToken?: string
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

            // Get customer info để gửi email
            const customer = await User.findById(appointment.customer_id);


            if (!googleAccessToken) {
                return {
                    success: false,
                    message: 'Google Access Token is required to create Google Meet link. Please authenticate with Google first.',
                    requiresGoogleAuth: true
                };
            }

            // Tạo datetime cho cuộc hẹn
            const appointmentDate = new Date(appointment.appointment_date);
            const [startHours, startMinutes] = appointment.start_time.split(':').map(Number);
            const [endHours, endMinutes] = appointment.end_time.split(':').map(Number);

            const startDateTime = new Date(appointmentDate);
            startDateTime.setHours(startHours, startMinutes, 0, 0);

            const endDateTime = new Date(appointmentDate);
            endDateTime.setHours(endHours, endMinutes, 0, 0);

            let meetingDetails;
            try {
                // Generate REAL Google Meet link - bắt buộc có access token
                meetingDetails = await GoogleMeetService.generateRealMeetLink(
                    `Tư vấn với ${(consultant.user_id as any).full_name}`,
                    startDateTime,
                    endDateTime,
                    customer ? [customer.email, (consultant.user_id as any).email] : [(consultant.user_id as any).email],
                    googleAccessToken
                );

                console.log('Real Google Meet created successfully:', meetingDetails);
            } catch (error) {
                console.error('Failed to create Google Meet:', error);
                return {
                    success: false,
                    message: `Failed to create Google Meet: ${error.message}. Please ensure your Google account has permission to create meetings.`,
                    requiresGoogleAuth: true
                };
            }

            // Update appointment với real meeting info
            const updateData = {
                status: 'confirmed' as const,
                meeting_info: {
                    meet_url: meetingDetails.meet_url,
                    meeting_id: meetingDetails.meeting_id,
                    calendar_event_id: meetingDetails.calendar_event_id,
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

            if (customer) {
                // Prepare email data với real meeting info
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
                        // Không có password vì đây là real Google Meet
                    },
                    appointmentId: appointmentId,
                    customerNotes: appointment.customer_notes
                };

                // Send confirmation email với real Google Meet link (non-blocking)
                EmailNotificationService.sendAppointmentConfirmation(emailData)
                    .then(result => {
                        if (result.success) {
                            console.log('Confirmation email with real Google Meet sent successfully');
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
                message: 'Appointment confirmed successfully and real Google Meet link has been sent to customer',
                data: {
                    appointment: confirmedAppointment,
                    meetingDetails: meetingDetails
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
            // THÊM: AUTHORIZATION CHECK - Customer chỉ được cancel appointment của mình
            if (requestUserRole === 'customer') {
                let customerIdToCheck: string;

                // Handle cả trường hợp customer_id được populate và không populate
                if (typeof appointment.customer_id === 'string') {
                    customerIdToCheck = appointment.customer_id;
                } else if (appointment.customer_id && typeof appointment.customer_id === 'object') {
                    customerIdToCheck = (appointment.customer_id as any)._id?.toString() || (appointment.customer_id as any).toString();
                } else {
                    customerIdToCheck = appointment.customer_id?.toString() || '';
                }

                if (customerIdToCheck !== requestUserId) {
                    return {
                        success: false,
                        message: 'This appointment is not belong to to you'
                    };
                }
            }
            // THÊM: AUTHORIZATION CHECK - Consultant chỉ được cancel appointment được assign cho mình
            if (requestUserRole === 'consultant') {
                let consultantIdFromAppointment: string;

                // Handle consultant_id
                if (typeof appointment.consultant_id === 'string') {
                    consultantIdFromAppointment = appointment.consultant_id;
                } else if (appointment.consultant_id && typeof appointment.consultant_id === 'object') {
                    consultantIdFromAppointment = (appointment.consultant_id as any)._id?.toString() || (appointment.consultant_id as any).toString();
                } else {
                    consultantIdFromAppointment = appointment.consultant_id?.toString() || '';
                }

                // Find consultant document để lấy user_id
                const consultant = await Consultant.findById(consultantIdFromAppointment).lean();
                if (!consultant || consultant.user_id.toString() !== requestUserId) {
                    return {
                        success: false,
                        message: 'This appointment is not belong to to you'
                    };
                }
            }
            // Store old data for history
            const oldData = { ...appointment };

            // BUSINESS RULE: Hủy lịch trước 4 tiếng
            const now = new Date();
            const appointmentDateTime = new Date(`${appointment.appointment_date.toISOString().split('T')[0]} ${appointment.start_time}:00`);
            const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            // Staff và Admin có thể hủy bất cứ lúc nào
            if (requestUserRole !== 'staff' && requestUserRole !== 'admin' && diffHours < 2) {
                return {
                    success: false,
                    message: 'Appointment can only be cancelled at least 2 hours before the scheduled time'
                };
            }

            // Use cancelById method từ repository
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
                    requestUserRole || 'unknown'
                );
            } catch (historyError) {
                console.error('History logging error:', historyError);
            }

            // Send cancellation email
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
                    meetingInfo: appointment.meeting_info,
                    appointmentId: appointmentId
                };

                EmailNotificationService.sendAppointmentCancellation(emailData, requestUserRole || 'system')
                    .catch(error => console.error('Error sending cancellation email:', error));
            }

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
     * UPDATE: Update appointment method - handle Google Meet creation for confirmed appointments
     */
    public static async updateAppointment(
        appointmentId: string,
        updateData: Partial<IAppointment>,
        requestUserId: string,
        requestUserRole?: string,
        explicitAction?: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed',
        googleAccessToken?: string
    ): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            // Business rules validation
            if (updateData.appointment_date || updateData.start_time || updateData.end_time) {
                // Safely extract consultant_id as string
                let consultantId: string;
                if (updateData.consultant_id) {
                    consultantId = updateData.consultant_id.toString();
                } else {
                    // Handle both populated and non-populated consultant_id
                    if (typeof appointment.consultant_id === 'string') {
                        consultantId = appointment.consultant_id;
                    } else if (appointment.consultant_id && typeof appointment.consultant_id === 'object') {
                        consultantId = (appointment.consultant_id as any)._id?.toString() || appointment.consultant_id.toString();
                    } else {
                        consultantId = appointment.consultant_id?.toString() || '';
                    }
                }

                const validationError = await this.validateAppointmentTime(
                    updateData.appointment_date || appointment.appointment_date,
                    updateData.start_time || appointment.start_time,
                    updateData.end_time || appointment.end_time,
                    consultantId,
                    appointmentId
                );

                if (validationError) {
                    return {
                        success: false,
                        message: `Time validation failed: ${validationError.message}`
                    };
                }
            }

            // Generate real meeting info nếu được confirmed và chưa có meeting info
            if (explicitAction === 'confirmed' && !appointment.meeting_info) {
                if (!googleAccessToken) {
                    return {
                        success: false,
                        message: 'Google Access Token is required to create Google Meet link for confirmed appointments.',
                        requiresGoogleAuth: true
                    };
                }

                const consultant = await Consultant.findById(appointment.consultant_id).populate('user_id', 'full_name email');
                const customer = await User.findById(appointment.customer_id);

                if (consultant) {
                    // Tạo datetime cho cuộc hẹn
                    const appointmentDate = new Date(updateData.appointment_date || appointment.appointment_date);
                    const startTime = updateData.start_time || appointment.start_time;
                    const endTime = updateData.end_time || appointment.end_time;

                    const [startHours, startMinutes] = startTime.split(':').map(Number);
                    const [endHours, endMinutes] = endTime.split(':').map(Number);

                    const startDateTime = new Date(appointmentDate);
                    startDateTime.setHours(startHours, startMinutes, 0, 0);

                    const endDateTime = new Date(appointmentDate);
                    endDateTime.setHours(endHours, endMinutes, 0, 0);

                    try {
                        const meetingDetails = await GoogleMeetService.generateRealMeetLink(
                            `Tư vấn với ${(consultant.user_id as any).full_name}`,
                            startDateTime,
                            endDateTime,
                            customer ? [customer.email, (consultant.user_id as any).email] : [(consultant.user_id as any).email],
                            googleAccessToken
                        );

                        updateData.meeting_info = {
                            meet_url: meetingDetails.meet_url,
                            meeting_id: meetingDetails.meeting_id,
                            created_at: new Date(),
                            reminder_sent: false
                        };
                    } catch (error) {
                        return {
                            success: false,
                            message: `Failed to create Google Meet: ${error.message}`,
                            requiresGoogleAuth: true
                        };
                    }
                }
            }

            // Store old data for history logging
            const oldData = { ...appointment };

            // Perform the update
            const updatedAppointment = await AppointmentRepository.updateById(appointmentId, updateData);

            if (!updatedAppointment) {
                return {
                    success: false,
                    message: 'Failed to update appointment'
                };
            }

            // Log appointment history if there was an explicit action
            if (explicitAction) {
                try {
                    await AppointmentHistoryService.logAppointmentUpdated(
                        appointmentId,
                        oldData,
                        updatedAppointment,
                        requestUserId,
                        requestUserRole || 'system',
                        explicitAction
                    );
                } catch (historyError) {
                    console.error('History logging error:', historyError);
                }
            }

            return {
                success: true,
                message: `Appointment ${explicitAction || 'updated'} successfully`,
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

    // Validation helper method
    private static async validateAppointmentTime(
        appointmentDate: Date,
        startTime: string,
        endTime: string,
        consultantId: string,
        excludeAppointmentId?: string
    ): Promise<{ message: string } | null> {
        // Validate 2-hour lead time
        const now = new Date();
        const [hours, minutes] = startTime.split(':').map(Number);
        const appointmentDateTime = new Date(appointmentDate);
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        const diffMs = appointmentDateTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 2) {
            return { message: `Appointment must be scheduled at least 2 hours in advance. Current lead time: ${diffHours.toFixed(1)} hours.` };
        }

        // Check for conflicts using checkTimeConflict method
        const hasConflict = await AppointmentRepository.checkTimeConflict(
            consultantId,
            appointmentDate,
            startTime,
            endTime,
            excludeAppointmentId
        );

        if (hasConflict) {
            return { message: 'The selected time slot conflicts with an existing appointment.' };
        }

        return null;
    }

    // Các methods khác...
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

    public static async sendMeetingReminder(appointmentId: string): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            if (!appointment.meeting_info) {
                return {
                    success: false,
                    message: 'No meeting information available'
                };
            }

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
                // Mark reminder as sent
                const updatedMeetingInfo = {
                    ...appointment.meeting_info,
                    reminder_sent: true
                };
                await AppointmentRepository.updateById(appointmentId, {
                    meeting_info: updatedMeetingInfo
                });

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
     * Send feedback reminder for a specific appointment
     */
    public static async sendFeedbackReminderForAppointment(appointmentId: string): Promise<AppointmentResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            if (appointment.status !== 'completed') {
                return {
                    success: false,
                    message: 'Only completed appointments can receive feedback reminders'
                };
            }

            if (appointment.feedback) {
                return {
                    success: false,
                    message: 'Appointment already has feedback'
                };
            }

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
                appointmentId: appointmentId
            };

            // Send feedback reminder email
            const emailResult = await EmailNotificationService.sendFeedbackReminder(emailData);

            if (emailResult.success) {
                return {
                    success: true,
                    message: 'Feedback reminder sent successfully'
                };
            } else {
                return {
                    success: false,
                    message: emailResult.message
                };
            }
        } catch (error) {
            console.error('Send feedback reminder service error:', error);
            return {
                success: false,
                message: 'Internal server error when sending feedback reminder'
            };
        }
    }

    /**
     * Start meeting (update status to in_progress)
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
                },
                timestamp: new Date().toISOString()
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
     * Complete appointment với meeting end và appointment history logging
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
            const consultant = await Consultant.findById(appointment.consultant_id);
            if (!consultant || consultant.user_id.toString() !== consultantUserId) {
                return {
                    success: false,
                    message: 'You can only complete your own appointments'
                };
            }

            // Complete appointment using repository method
            const completedAppointment = await AppointmentRepository.completeById(
                appointmentId,
                consultantNotes
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

            // Send feedback reminder email to customer
            try {
                const customer = await User.findById(appointment.customer_id);
                if (customer) {
                    const emailData = {
                        customerName: customer.full_name,
                        customerEmail: customer.email,
                        consultantName: (consultant.user_id as any).full_name,
                        appointmentDate: appointment.appointment_date.toLocaleDateString('vi-VN'),
                        startTime: appointment.start_time,
                        endTime: appointment.end_time,
                        appointmentId: appointmentId
                    };

                    // Send feedback reminder (non-blocking)
                    EmailNotificationService.sendFeedbackReminder(emailData)
                        .then(result => {
                            if (result.success) {
                                console.log(' Feedback reminder email sent successfully to:', customer.email);
                            } else {
                                console.error('Failed to send feedback reminder:', result.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error sending feedback reminder email:', error);
                        });
                }
            } catch (emailError) {
                console.error('Error preparing feedback reminder email:', emailError);
            }

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

    // ================== FEEDBACK METHODS ==================

    /**
     * Submit feedback for a completed appointment
     */
    public static async submitFeedback(
        appointmentId: string,
        customerId: string,
        feedbackData: CreateFeedbackRequest
    ): Promise<FeedbackResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            // Business rule 1: Only customer can feedback their own appointment
            if (appointment.customer_id._id.toString() !== customerId) {
                return {
                    success: false,
                    message: 'You can only provide feedback for your own appointments'
                };
            }

            // Business rule 2: Only completed appointments can receive feedback
            if (appointment.status !== 'completed') {
                return {
                    success: false,
                    message: 'Feedback can only be submitted for completed appointments'
                };
            }

            // Business rule 3: Feedback can only be submitted once
            if (appointment.feedback) {
                return {
                    success: false,
                    message: 'Feedback has already been submitted for this appointment'
                };
            }

            // Create feedback object
            const feedbackObject = {
                rating: feedbackData.rating,
                comment: feedbackData.comment?.trim() || undefined,
                feedback_date: new Date(),
            };

            // Update appointment with feedback
            const updatedAppointment = await AppointmentRepository.updateById(appointmentId, {
                feedback: feedbackObject
            });

            if (!updatedAppointment) {
                return {
                    success: false,
                    message: 'Failed to save feedback'
                };
            }

            // Get consultant info for response
            const consultant = await Consultant.findById(appointment.consultant_id).populate('user_id', 'full_name');
            const consultantName = consultant ? (consultant.user_id as any).full_name : 'Unknown';

            // Log feedback submission in appointment history
            try {
                await AppointmentHistoryService.createHistory({
                    appointment_id: appointmentId,
                    action: 'updated',
                    performed_by_user_id: customerId,
                    performed_by_role: 'customer',
                    old_data: { feedback: null },
                    new_data: { feedback: feedbackObject }
                });
            } catch (historyError) {
                console.error('Failed to log feedback in history:', historyError);
            }

            return {
                success: true,
                message: 'Feedback submitted successfully',
                data: {
                    appointment_id: appointmentId,
                    feedback: {
                        rating: feedbackObject.rating,
                        comment: feedbackObject.comment,
                        feedback_date: feedbackObject.feedback_date.toISOString(),
                    },
                    appointment_info: {
                        consultant_name: consultantName,
                        appointment_date: appointment.appointment_date.toLocaleDateString('vi-VN'),
                        start_time: appointment.start_time,
                        end_time: appointment.end_time
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Submit feedback service error:', error);
            return {
                success: false,
                message: 'Internal server error when submitting feedback'
            };
        }
    }

    /**
     * Get feedback for a specific appointment
     */
    public static async getAppointmentFeedback(
        appointmentId: string,
        requestUserId: string,
        requestUserRole: string
    ): Promise<FeedbackResponse> {
        try {
            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            // Check permission - only customer, consultant, staff, admin can view feedback
            const canView = await this.canUserViewAppointment(appointment, requestUserId, requestUserRole);
            if (!canView) {
                return {
                    success: false,
                    message: 'You do not have permission to view this feedback'
                };
            }

            if (!appointment.feedback) {
                return {
                    success: false,
                    message: 'No feedback available for this appointment'
                };
            }

            // Get consultant info
            const consultant = await Consultant.findById(appointment.consultant_id).populate('user_id', 'full_name');
            const consultantName = consultant ? (consultant.user_id as any).full_name : 'Unknown';

            return {
                success: true,
                message: 'Feedback retrieved successfully',
                data: {
                    appointment_id: appointmentId,
                    feedback: {
                        rating: appointment.feedback.rating,
                        comment: appointment.feedback.comment,
                        feedback_date: appointment.feedback.feedback_date.toISOString(),
                    },
                    appointment_info: {
                        consultant_name: consultantName,
                        appointment_date: appointment.appointment_date.toLocaleDateString('vi-VN'),
                        start_time: appointment.start_time,
                        end_time: appointment.end_time
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get appointment feedback service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving feedback'
            };
        }
    }

    /**
     * Get feedback statistics for a consultant
     */
    public static async getConsultantFeedbackStats(
        consultantId: string,
        requestUserId: string,
        requestUserRole: string
    ): Promise<FeedbackStatsResponse> {
        try {
            // Get consultant info
            const consultant = await Consultant.findById(consultantId).populate('user_id', 'full_name');
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Check permission - only consultant themselves, staff, or admin can view stats
            if (requestUserRole === 'consultant') {
                const requestingConsultant = await Consultant.findOne({ user_id: requestUserId });
                if (!requestingConsultant || requestingConsultant._id.toString() !== consultantId) {
                    return {
                        success: false,
                        message: 'You can only view your own feedback statistics'
                    };
                }
            } else if (!['staff', 'admin'].includes(requestUserRole)) {
                return {
                    success: false,
                    message: 'You do not have permission to view feedback statistics'
                };
            }

            // Get all completed appointments with feedback for this consultant
            const appointmentsWithFeedback = await AppointmentRepository.findByConsultantId(
                consultantId,
                'completed'
            );

            const feedbacks = appointmentsWithFeedback.filter(apt => apt.feedback);

            if (feedbacks.length === 0) {
                return {
                    success: true,
                    message: 'No feedback data available',
                    data: {
                        consultant_id: consultantId,
                        consultant_name: (consultant.user_id as any).full_name,
                        total_feedbacks: 0,
                        average_rating: 0,
                        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                        recent_feedbacks: []
                    },
                    timestamp: new Date().toISOString()
                };
            }

            // Calculate statistics
            const totalFeedbacks = feedbacks.length;
            const totalRating = feedbacks.reduce((sum, apt) => sum + apt.feedback!.rating, 0);
            const averageRating = Math.round((totalRating / totalFeedbacks) * 10) / 10;

            // Rating distribution
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            feedbacks.forEach(apt => {
                const rating = apt.feedback!.rating as keyof typeof ratingDistribution;
                ratingDistribution[rating]++;
            });

            // Recent feedbacks (last 10)
            const recentFeedbacks = feedbacks
                .sort((a, b) => new Date(b.feedback!.feedback_date).getTime() - new Date(a.feedback!.feedback_date).getTime())
                .slice(0, 10)
                .map(apt => {
                    // Get customer name
                    let customerName = 'Unknown';
                    if (apt.customer_id && typeof apt.customer_id === 'object' && 'full_name' in apt.customer_id) {
                        customerName = (apt.customer_id as any).full_name;
                    }

                    return {
                        appointment_id: apt._id.toString(),
                        rating: apt.feedback!.rating,
                        comment: apt.feedback!.comment,
                        feedback_date: apt.feedback!.feedback_date.toISOString(),
                        customer_name: customerName
                    };
                });

            return {
                success: true,
                message: 'Feedback statistics retrieved successfully',
                data: {
                    consultant_id: consultantId,
                    consultant_name: (consultant.user_id as any).full_name,
                    total_feedbacks: totalFeedbacks,
                    average_rating: averageRating,
                    rating_distribution: ratingDistribution,
                    recent_feedbacks: recentFeedbacks
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get consultant feedback stats service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving feedback statistics'
            };
        }
    }

    /**
     * Get all feedback for admin/staff (with pagination)
     */
    public static async getAllFeedback(
        page: number = 1,
        limit: number = 20,
        consultantId?: string,
        minRating?: number,
        maxRating?: number
    ): Promise<{
        success: boolean;
        message: string;
        data?: {
            feedbacks: any[];
            pagination: {
                current_page: number;
                total_pages: number;
                total_items: number;
                items_per_page: number;
            };
        };
        timestamp?: string;
    }> {
        try {
            // Use existing repository method
            const result = await AppointmentRepository.findAllAppointmentsWithFeedback(
                {
                    consultantId,
                    minRating,
                    maxRating
                },
                page,
                limit
            );

            const { appointments, total } = result;
            const totalPages = Math.ceil(total / limit);

            // Format response data
            const formattedFeedbacks = appointments.map(apt => {
                const customer = apt.customer_id as any;
                const consultant = apt.consultant_id as any;

                return {
                    appointment_id: apt._id,
                    feedback: {
                        rating: apt.feedback!.rating,
                        comment: apt.feedback!.comment,
                        feedback_date: apt.feedback!.feedback_date,
                    },
                    appointment_info: {
                        appointment_date: apt.appointment_date,
                        start_time: apt.start_time,
                        end_time: apt.end_time
                    },
                    customer_info: {
                        customer_id: customer._id,
                        customer_name: customer.full_name,
                        customer_email: customer.email
                    },
                    consultant_info: {
                        consultant_id: consultant._id,
                        consultant_name: consultant.user_id?.full_name || 'Unknown',
                        specialization: consultant.specialization
                    }
                };
            });

            return {
                success: true,
                message: 'All feedback retrieved successfully',
                data: {
                    feedbacks: formattedFeedbacks,
                    pagination: {
                        current_page: page,
                        total_pages: totalPages,
                        total_items: total,
                        items_per_page: limit
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get all feedback service error:', error);
            return {
                success: false,
                message: 'Internal server error when retrieving all feedback'
            };
        }
    }

    /**
     * Helper: Check if user can view appointment
     */
    private static async canUserViewAppointment(
        appointment: any,
        userId: string,
        userRole: string
    ): Promise<boolean> {
        try {
            // Customer can view their own appointments
            if (appointment.customer_id._id.toString() === userId) {
                return true;
            }

            // Consultant can view appointments assigned to them
            const consultant = await Consultant.findById(appointment.consultant_id).lean();
            if (consultant && consultant.user_id.toString() === userId) {
                return true;
            }

            // Staff and admin can view any appointment
            if (['staff', 'admin'].includes(userRole)) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking user view permission:', error);
            return false;
        }
    }

    /**
     * Helper: Check if user can modify appointment
     */
    private static async canUserModifyAppointment(
        appointment: any,
        userId: string,
        userRole: string
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

    /**
 * Get appointments với pagination và filtering
 */
    public static async getAppointmentsWithPagination(query: AppointmentQuery) {
        try {
            // Validate pagination parameters
            const { page, limit, sort_by, sort_order } = PaginationUtils.validatePagination(query);

            // Build filter query
            const filters = PaginationUtils.buildAppointmentFilter(query);

            // Sanitize search
            if (query.search) {
                query.search = PaginationUtils.sanitizeSearch(query.search);
            }

            // Get data từ repository
            const result = await AppointmentRepository.findWithPagination(
                filters,
                page,
                limit,
                sort_by || 'appointment_date',
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
            if (query.search) filters_applied.search = query.search;
            if (query.customer_id) filters_applied.customer_id = query.customer_id;
            if (query.consultant_id) filters_applied.consultant_id = query.consultant_id;
            if (query.status) filters_applied.status = query.status;
            if (query.appointment_date_from) filters_applied.appointment_date_from = query.appointment_date_from;
            if (query.appointment_date_to) filters_applied.appointment_date_to = query.appointment_date_to;
            if (query.video_call_status) filters_applied.video_call_status = query.video_call_status;
            if (query.has_feedback !== undefined) filters_applied.has_feedback = query.has_feedback;
            if (query.feedback_rating) filters_applied.feedback_rating = query.feedback_rating;
            if (query.sort_by) filters_applied.sort_by = query.sort_by;
            if (query.sort_order) filters_applied.sort_order = query.sort_order;

            return {
                success: true,
                message: result.appointments.length > 0
                    ? 'Appointments retrieved successfully'
                    : 'No appointments found matching the criteria',
                data: {
                    appointments: result.appointments,
                    pagination,
                    filters_applied
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Appointment service pagination error:', error);
            return {
                success: false,
                message: 'Internal server error when getting appointments'
            };
        }
    }

    /**
     * Get appointment statistics
     */
    public static async getAppointmentStatistics(filters: any = {}) {
        try {
            const stats = await AppointmentRepository.getAppointmentStats(filters);

            return {
                success: true,
                message: 'Appointment statistics retrieved successfully',
                data: {
                    statistics: stats
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get appointment statistics error:', error);
            return {
                success: false,
                message: 'Internal server error when getting appointment statistics'
            };
        }

        /**
 * Get all appointments với basic filtering (for staff/admin)
 */

    }
    public static async getAllAppointments(
        status?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<AppointmentResponse> {
        try {
            // Build basic filter
            const filters: any = {};

            if (status) {
                filters.status = status;
            }

            if (startDate || endDate) {
                filters.appointment_date = {};
                if (startDate) {
                    filters.appointment_date.$gte = startDate;
                }
                if (endDate) {
                    const endOfDay = new Date(endDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    filters.appointment_date.$lte = endOfDay;
                }
            }

            // Get appointments using repository
            const appointments = await AppointmentRepository.findAll(filters);

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
                message: 'Internal server error when retrieving all appointments'
            };
        }
    }
}