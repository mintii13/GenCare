import { Router } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { AppointmentHistoryService } from '../services/appointmentHistoryService';
import { ReminderSchedulerService } from '../services/reminderSchedulerService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateBookAppointment, validateUpdateAppointment } from '../middlewares/appointmentValidation';
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

export default router;