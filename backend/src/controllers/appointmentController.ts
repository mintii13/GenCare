import { Router } from 'express';
import { AppointmentService } from '../services/appointmentService';
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

// Update appointment
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

// Confirm appointment (consultant only)
router.put(
    '/:appointmentId/confirm',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;

            const result = await AppointmentService.confirmAppointment(
                appointmentId,
                user.userId
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

// Complete appointment (consultant only)
router.put(
    '/:appointmentId/complete',
    authenticateToken,
    authorizeRoles('consultant'),
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

// Reschedule appointment
router.put(
    '/:appointmentId/reschedule',
    authenticateToken,
    authorizeRoles('customer', 'consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const appointmentId = req.params.appointmentId;
            const { appointment_date, start_time, end_time } = req.body;

            if (!appointment_date || !start_time || !end_time) {
                return res.status(400).json({
                    success: false,
                    message: 'appointment_date, start_time, and end_time are required'
                });
            }

            const result = await AppointmentService.rescheduleAppointment(
                appointmentId,
                new Date(appointment_date),
                start_time,
                end_time,
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

export default router;