import { Router } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { AppointmentHistoryService } from '../services/appointmentHistoryService';
import { ReminderSchedulerService } from '../services/reminderSchedulerService';
import { AppointmentRepository } from '../repositories/appointmentRepository';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateBookAppointment, validateUpdateAppointment, validateFeedback } from '../middlewares/appointmentValidation';
import { JWTPayload } from '../utils/jwtUtils';
import { Consultant } from '../models/Consultant';

const router = Router();

// Book appointment (customer only)
router.post(
    '/book',
    authenticateToken,
    authorizeRoles('customer'),
    validateBookAppointment,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;

            // Customer chỉ có thể book cho chính mình
            const appointmentData = {
                ...req.body,
                customer_id: user.userId,
                appointment_date: new Date(req.body.appointment_date)
            };

            const result = await AppointmentService.bookAppointment(appointmentData);

            // Log history if booking successful
            if (result.success && result.data?.appointment) {
                await AppointmentHistoryService.logAppointmentCreated(
                    result.data.appointment._id,
                    result.data.appointment,
                    user.userId,
                    user.role
                );
            }

            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get customer's appointments
router.get(
    '/my-appointments',
    authenticateToken,
    authorizeRoles('customer'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const { status, start_date, end_date } = req.query;

            const result = await AppointmentService.getCustomerAppointments(
                user.userId,
                status as string,
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get consultant's appointments
router.get(
    '/consultant-appointments',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const consultant = await Consultant.findOne({ user_id: user.userId });

            if (!consultant) {
                return res.status(400).json({
                    success: false,
                    message: 'Consultant profile not found'
                });
            }

            const { status, start_date, end_date } = req.query;

            const result = await AppointmentService.getConsultantAppointments(
                consultant._id.toString(),
                status as string,
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get appointment by ID
router.get(
    '/:appointmentId',
    authenticateToken,
    authorizeRoles('customer', 'consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            const result = await AppointmentService.getAppointmentById(appointmentId);

            if (!result.success) {
                return res.status(404).json(result);
            }

            // Kiểm tra quyền xem appointment
            const appointment = result.data?.appointment;

            if (user.role === 'customer') {
                if (appointment.customer_id._id.toString() !== user.userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view your own appointments'
                    });
                }
            } else if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant || appointment.consultant_id._id.toString() !== consultant._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view your own appointments'
                    });
                }
            }
            // Staff và admin có thể xem tất cả

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Cancel appointment
router.put(
    '/:appointmentId/cancel',
    authenticateToken,
    authorizeRoles('customer', 'consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            const result = await AppointmentService.cancelAppointment(
                appointmentId,
                user.userId,
                user.role
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Confirm appointment - ENHANCED với meeting link generation
router.put(
    '/:appointmentId/confirm',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            // Nếu là consultant, dùng confirmAppointment method với meeting link
            if (user.role === 'consultant') {
                const result = await AppointmentService.confirmAppointment(
                    appointmentId,
                    user.userId
                );

                if (result.success) {
                    res.json(result);
                } else {
                    res.status(400).json(result);
                }
            } else {
                // Staff/Admin dùng updateAppointment method
                const result = await AppointmentService.updateAppointment(
                    appointmentId,
                    { status: 'confirmed' },
                    user.userId,
                    user.role
                );

                if (result.success) {
                    res.json(result);
                } else {
                    res.status(400).json(result);
                }
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Complete appointment
router.put(
    '/:appointmentId/complete',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;
            const { consultant_notes } = req.body;

            const result = await AppointmentService.completeAppointment(
                appointmentId,
                user.userId,
                consultant_notes
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Send meeting reminder
router.post(
    '/:appointmentId/send-reminder',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const appointmentId = req.params.appointmentId;

            const result = await AppointmentService.sendMeetingReminder(appointmentId);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Start meeting
router.put(
    '/:appointmentId/start-meeting',
    authenticateToken,
    authorizeRoles('customer', 'consultant'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            const result = await AppointmentService.startMeeting(appointmentId, user.userId);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get meeting info
router.get(
    '/:appointmentId/meeting-info',
    authenticateToken,
    authorizeRoles('customer', 'consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            const result = await AppointmentService.getAppointmentById(appointmentId);

            if (!result.success) {
                return res.status(404).json(result);
            }

            const appointment = result.data?.appointment;

            // Check permission
            if (user.role === 'customer') {
                if (appointment.customer_id._id.toString() !== user.userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view your own appointment meeting info'
                    });
                }
            } else if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant || appointment.consultant_id._id.toString() !== consultant._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view your own appointment meeting info'
                    });
                }
            }

            // Return meeting info
            if (!appointment.meeting_info) {
                return res.status(400).json({
                    success: false,
                    message: 'No meeting information available. Appointment may not be confirmed yet.'
                });
            }

            res.json({
                success: true,
                message: 'Meeting information retrieved successfully',
                data: {
                    meeting_info: appointment.meeting_info,
                    appointment_status: appointment.status,
                    video_call_status: appointment.video_call_status
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// UNIFIED UPDATE: Handles notes, time, status updates - includes duplicate validation
router.put(
    '/:appointmentId',
    authenticateToken,
    authorizeRoles('customer', 'consultant', 'staff', 'admin'),
    validateUpdateAppointment,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            // Convert date if provided
            if (req.body.appointment_date) {
                req.body.appointment_date = new Date(req.body.appointment_date);
            }

            // Service handles all validation, duplicate checking, and history logging
            const result = await AppointmentService.updateAppointment(
                appointmentId,
                req.body,
                user.userId,
                user.role
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get appointment history
router.get(
    '/:appointmentId/history',
    authenticateToken,
    authorizeRoles('customer', 'consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            // Check if user has permission to view this appointment's history
            const appointmentResult = await AppointmentService.getAppointmentById(appointmentId);
            if (!appointmentResult.success) {
                return res.status(404).json(appointmentResult);
            }

            const appointment = appointmentResult.data?.appointment;

            // Same permission check as viewing appointment
            if (user.role === 'customer') {
                if (appointment.customer_id._id.toString() !== user.userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view history of your own appointments'
                    });
                }
            } else if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant || appointment.consultant_id._id.toString() !== consultant._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view history of your own appointments'
                    });
                }
            }

            const history = await AppointmentHistoryService.getAppointmentHistory(appointmentId);

            res.json({
                success: true,
                message: 'Appointment history retrieved successfully',
                data: {
                    appointment_id: appointmentId,
                    history: history
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get all appointments (staff & admin only)
router.get(
    '/admin/all',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            const { status, start_date, end_date, consultant_id, customer_id } = req.query;

            const result = await AppointmentService.getAllAppointments(
                status as string,
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined,
                consultant_id as string,
                customer_id as string
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get appointment statistics
router.get(
    '/admin/stats',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const { consultant_id, start_date, end_date } = req.query;

            let targetConsultantId = consultant_id as string;

            // Nếu là consultant, chỉ được xem stats của chính mình
            if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant) {
                    return res.status(400).json({
                        success: false,
                        message: 'Consultant profile not found'
                    });
                }
                targetConsultantId = consultant._id.toString();
            }

            const result = await AppointmentService.getAppointmentStats(
                targetConsultantId,
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get activity history (for admin/staff)
router.get(
    '/admin/activity-history',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            const { user_id, limit } = req.query;

            let history;
            if (user_id) {
                history = await AppointmentHistoryService.getUserActivityHistory(
                    user_id as string,
                    limit ? parseInt(limit as string) : 50
                );
            } else {
                // Get general action stats
                const stats = await AppointmentHistoryService.getActionStats();
                return res.json({
                    success: true,
                    message: 'Activity statistics retrieved successfully',
                    data: {
                        action_stats: stats
                    },
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'Activity history retrieved successfully',
                data: {
                    history: history
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get appointments for specific consultant (staff & admin can specify consultant_id)
router.get(
    '/consultant/:consultantId',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            const consultantId = req.params.consultantId;
            const { status, start_date, end_date } = req.query;

            const result = await AppointmentService.getConsultantAppointments(
                consultantId,
                status as string,
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get appointments for specific customer (staff & admin can specify customer_id)
router.get(
    '/customer/:customerId',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            const customerId = req.params.customerId;
            const { status, start_date, end_date } = req.query;

            const result = await AppointmentService.getCustomerAppointments(
                customerId,
                status as string,
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ================== REMINDER SCHEDULER MANAGEMENT ROUTES ==================

// Get reminder scheduler status
router.get(
    '/admin/reminder-status',
    authenticateToken,
    authorizeRoles('admin'),
    async (req, res) => {
        try {
            const status = ReminderSchedulerService.getStatus();

            res.json({
                success: true,
                message: 'Reminder scheduler status retrieved successfully',
                data: status,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Manual trigger reminder check
router.post(
    '/admin/reminder-manual-check',
    authenticateToken,
    authorizeRoles('admin'),
    async (req, res) => {
        try {
            const result = await ReminderSchedulerService.triggerReminderCheck();

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get upcoming reminders
router.get(
    '/admin/upcoming-reminders',
    authenticateToken,
    authorizeRoles('admin'),
    async (req, res) => {
        try {
            const result = await ReminderSchedulerService.getUpcomingReminders();

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Upcoming reminders retrieved successfully',
                    ...result,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Force send reminder for specific appointment
router.post(
    '/admin/reminder-force-send/:appointmentId',
    authenticateToken,
    authorizeRoles('admin'),
    async (req, res) => {
        try {
            const appointmentId = req.params.appointmentId;

            const result = await ReminderSchedulerService.forceSendReminder(appointmentId);

            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    data: {
                        appointment_id: appointmentId,
                        action: 'force_reminder_sent'
                    },
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Restart reminder scheduler
router.post(
    '/admin/reminder-restart',
    authenticateToken,
    authorizeRoles('admin'),
    async (req, res) => {
        try {
            ReminderSchedulerService.restartScheduler();

            res.json({
                success: true,
                message: 'Reminder scheduler restarted successfully',
                data: {
                    action: 'scheduler_restarted',
                    status: ReminderSchedulerService.getStatus()
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ================== FEEDBACK ROUTES ==================

// Submit feedback for completed appointment (customer only)
router.post(
    '/:appointmentId/feedback',
    authenticateToken,
    authorizeRoles('customer'),
    validateFeedback,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;
            const feedbackData = req.body;

            const result = await AppointmentService.submitFeedback(
                appointmentId,
                user.userId,
                feedbackData
            );

            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get feedback for appointment
router.get(
    '/:appointmentId/feedback',
    authenticateToken,
    authorizeRoles('customer', 'consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            const result = await AppointmentService.getAppointmentFeedback(
                appointmentId,
                user.userId,
                user.role
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(result.success === false && result.message.includes('not found') ? 404 : 400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get consultant feedback statistics
router.get(
    '/consultant/:consultantId/feedback-stats',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const consultantId = req.params.consultantId;

            const result = await AppointmentService.getConsultantFeedbackStats(
                consultantId,
                user.userId,
                user.role
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get own feedback statistics (for consultant)
router.get(
    '/my-feedback-stats',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;

            // Find consultant profile
            const consultant = await Consultant.findOne({ user_id: user.userId });
            if (!consultant) {
                return res.status(400).json({
                    success: false,
                    message: 'Consultant profile not found'
                });
            }

            const result = await AppointmentService.getConsultantFeedbackStats(
                consultant._id.toString(),
                user.userId,
                user.role
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get all feedback (admin/staff only) with pagination and filters
router.get(
    '/admin/all-feedback',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const consultantId = req.query.consultant_id as string;
            const minRating = req.query.min_rating ? parseInt(req.query.min_rating as string) : undefined;
            const maxRating = req.query.max_rating ? parseInt(req.query.max_rating as string) : undefined;

            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100'
                });
            }

            // Validate rating parameters
            if ((minRating && (minRating < 1 || minRating > 5)) ||
                (maxRating && (maxRating < 1 || maxRating > 5))) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating parameters must be between 1 and 5'
                });
            }

            const result = await AppointmentService.getAllFeedback(
                page,
                limit,
                consultantId,
                minRating,
                maxRating
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get customer's own feedback history
router.get(
    '/my-feedback',
    authenticateToken,
    authorizeRoles('customer'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            // Get customer's appointments with feedback
            const appointments = await AppointmentRepository.findByCustomerId(
                user.userId,
                'completed'
            );

            const appointmentsWithFeedback = appointments.filter(apt => apt.feedback);

            // Pagination
            const totalItems = appointmentsWithFeedback.length;
            const totalPages = Math.ceil(totalItems / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedAppointments = appointmentsWithFeedback.slice(startIndex, endIndex);

            const feedbackHistory = paginatedAppointments.map(apt => {
                // Safe access to consultant name
                let consultantName = 'Unknown';
                if (apt.consultant_id && typeof apt.consultant_id === 'object') {
                    const consultant = apt.consultant_id as any;
                    if (consultant.user_id && typeof consultant.user_id === 'object' && 'full_name' in consultant.user_id) {
                        consultantName = consultant.user_id.full_name;
                    }
                }

                return {
                    appointment_id: apt._id,
                    appointment_date: apt.appointment_date.toLocaleDateString('vi-VN'),
                    start_time: apt.start_time,
                    end_time: apt.end_time,
                    consultant_name: consultantName,
                    feedback: {
                        rating: apt.feedback!.rating,
                        comment: apt.feedback!.comment,
                        feedback_date: apt.feedback!.feedback_date.toISOString(),
                    }
                };
            });

            res.json({
                success: true,
                message: 'Feedback history retrieved successfully',
                data: {
                    feedbacks: feedbackHistory,
                    pagination: {
                        current_page: page,
                        total_pages: totalPages,
                        total_items: totalItems,
                        items_per_page: limit
                    }
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Check if appointment can be feedback (customer only)
router.get(
    '/:appointmentId/can-feedback',
    authenticateToken,
    authorizeRoles('customer'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }

            // Check if customer owns this appointment
            if (appointment.customer_id._id.toString() !== user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only check feedback status for your own appointments'
                });
            }

            const canFeedback = appointment.status === 'completed' && !appointment.feedback;
            const reason = !canFeedback
                ? appointment.status !== 'completed'
                    ? 'Appointment must be completed to provide feedback'
                    : 'Feedback has already been submitted'
                : null;

            res.json({
                success: true,
                message: 'Feedback status checked successfully',
                data: {
                    appointment_id: appointmentId,
                    can_feedback: canFeedback,
                    reason: reason,
                    appointment_status: appointment.status,
                    has_feedback: !!appointment.feedback
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Update feedback (customer only, within 24 hours)
router.put(
    '/:appointmentId/feedback',
    authenticateToken,
    authorizeRoles('customer'),
    validateFeedback,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;
            const updateData = req.body;

            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }

            // Check ownership
            if (appointment.customer_id._id.toString() !== user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update feedback for your own appointments'
                });
            }

            // Check if feedback exists
            if (!appointment.feedback) {
                return res.status(400).json({
                    success: false,
                    message: 'No feedback found to update. Please submit feedback first.'
                });
            }

            // Check if feedback is within 24 hours (business rule)
            const feedbackDate = new Date(appointment.feedback.feedback_date);
            const now = new Date();
            const hoursDiff = (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return res.status(400).json({
                    success: false,
                    message: 'Feedback can only be updated within 24 hours of submission'
                });
            }

            // Store old feedback for history
            const oldFeedback = { ...appointment.feedback };

            // Update feedback
            const updatedFeedback = {
                rating: updateData.rating,
                comment: updateData.comment?.trim() || undefined,
                feedback_date: feedbackDate // Keep original feedback date
            };

            const updatedAppointment = await AppointmentRepository.updateById(appointmentId, {
                feedback: updatedFeedback
            });

            if (!updatedAppointment) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update feedback'
                });
            }

            // Log feedback update in history
            try {
                await AppointmentHistoryService.createHistory({
                    appointment_id: appointmentId,
                    action: 'updated',
                    performed_by_user_id: user.userId,
                    performed_by_role: 'customer',
                    old_data: { feedback: oldFeedback },
                    new_data: { feedback: updatedFeedback }
                });
            } catch (historyError) {
                console.error('Failed to log feedback update in history:', historyError);
            }

            // Get consultant info for response
            const consultant = await Consultant.findById(appointment.consultant_id).populate('user_id', 'full_name');
            const consultantName = consultant ? (consultant.user_id as any).full_name : 'Unknown';

            res.json({
                success: true,
                message: 'Feedback updated successfully',
                data: {
                    appointment_id: appointmentId,
                    feedback: {
                        rating: updatedFeedback.rating,
                        comment: updatedFeedback.comment,
                        feedback_date: updatedFeedback.feedback_date.toISOString()
                    },
                    appointment_info: {
                        consultant_name: consultantName,
                        appointment_date: appointment.appointment_date.toLocaleDateString('vi-VN'),
                        start_time: appointment.start_time,
                        end_time: appointment.end_time
                    }
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Delete feedback (customer only, within 24 hours)
router.delete(
    '/:appointmentId/feedback',
    authenticateToken,
    authorizeRoles('customer'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            const appointment = await AppointmentRepository.findById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }

            // Check ownership
            if (appointment.customer_id._id.toString() !== user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete feedback for your own appointments'
                });
            }

            // Check if feedback exists
            if (!appointment.feedback) {
                return res.status(400).json({
                    success: false,
                    message: 'No feedback found to delete'
                });
            }

            // Check if feedback is within 24 hours (business rule)
            const feedbackDate = new Date(appointment.feedback.feedback_date);
            const now = new Date();
            const hoursDiff = (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return res.status(400).json({
                    success: false,
                    message: 'Feedback can only be deleted within 24 hours of submission'
                });
            }

            // Store old feedback for history
            const oldFeedback = { ...appointment.feedback };

            // Remove feedback using the dedicated repository method
            const updatedAppointment = await AppointmentRepository.removeFeedback(appointmentId);

            if (!updatedAppointment) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete feedback'
                });
            }

            // Log feedback deletion in history
            try {
                await AppointmentHistoryService.createHistory({
                    appointment_id: appointmentId,
                    action: 'updated',
                    performed_by_user_id: user.userId,
                    performed_by_role: 'customer',
                    old_data: { feedback: oldFeedback },
                    new_data: { feedback: null }
                });
            } catch (historyError) {
                console.error('Failed to log feedback deletion in history:', historyError);
            }

            res.json({
                success: true,
                message: 'Feedback deleted successfully',
                data: {
                    appointment_id: appointmentId,
                    action: 'feedback_deleted'
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);


export default router;