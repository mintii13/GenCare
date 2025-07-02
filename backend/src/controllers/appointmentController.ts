import { Router, Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { AppointmentRepository } from '../repositories/appointmentRepository';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { Consultant } from '../models/Consultant';
import { AppointmentHistoryService } from '../services/appointmentHistoryService';
import { validateBookAppointment, validateUpdateAppointment, validateFeedback } from '../middlewares/appointmentValidation';

// Extend Request để có jwtUser
declare global {
    namespace Express {
        interface Request {
            jwtUser?: {
                userId: string;
                role: string;
            };
        }
    }
}

interface JWTPayload {
    userId: string;
    role: string;
}

const router = Router();

// ================== SPECIFIC ROUTES FIRST (no parameters) ==================

// Book appointment - Customer only
router.post('/book', authenticateToken, authorizeRoles('customer'), validateBookAppointment, async (req: Request, res: Response) => {
    try {
        const { consultant_id, appointment_date, start_time, end_time, customer_notes } = req.body;
        const customer_id = req.jwtUser?.userId;

        if (!customer_id) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const result = await AppointmentService.bookAppointment({
            customer_id,
            consultant_id,
            appointment_date: new Date(appointment_date),
            start_time,
            end_time,
            customer_notes
        });

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Book appointment controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get customer appointments
router.get('/my-appointments', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response) => {
    try {
        const customerId = req.jwtUser?.userId;
        const { status, start_date, end_date } = req.query;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const result = await AppointmentService.getCustomerAppointments(
            customerId,
            status as string,
            start_date ? new Date(start_date as string) : undefined,
            end_date ? new Date(end_date as string) : undefined
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Get customer appointments controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get consultant appointments
router.get('/consultant/my-appointments', authenticateToken, authorizeRoles('consultant'), async (req: Request, res: Response) => {
    try {
        const consultantUserId = req.jwtUser?.userId;
        const { status, start_date, end_date } = req.query;

        if (!consultantUserId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        // Find consultant by user_id
        const consultant = await Consultant.findOne({ user_id: consultantUserId });
        if (!consultant) {
            return res.status(404).json({
                success: false,
                message: 'Consultant profile not found'
            });
        }

        const result = await AppointmentService.getConsultantAppointments(
            consultant._id.toString(),
            status as string,
            start_date ? new Date(start_date as string) : undefined,
            end_date ? new Date(end_date as string) : undefined
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Get consultant appointments controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all appointments - Staff, Admin only
router.get('/admin/all', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
    try {
        const { status, start_date, end_date, customer_id, consultant_id } = req.query;

        const appointments = await AppointmentRepository.findAll(
            status as string,
            start_date ? new Date(start_date as string) : undefined,
            end_date ? new Date(end_date as string) : undefined,
            consultant_id as string,
            customer_id as string
        );

        res.status(200).json({
            success: true,
            message: 'All appointments retrieved successfully',
            data: {
                appointments,
                total: appointments.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get all appointments controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get appointment statistics - Staff, Admin, Consultant only  
router.get('/admin/stats', authenticateToken, authorizeRoles('consultant', 'staff', 'admin'), async (req: Request, res: Response) => {
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

        const stats = await AppointmentRepository.countByStatus(
            targetConsultantId,
            start_date ? new Date(start_date as string) : undefined,
            end_date ? new Date(end_date as string) : undefined
        );

        res.status(200).json({
            success: true,
            message: 'Appointment statistics retrieved successfully',
            data: {
                stats
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get appointment statistics controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get activity history (for admin/staff)
router.get('/admin/activity-history', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
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
});

// Get all feedback (admin/staff only, with pagination)
router.get('/admin/feedback', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20, consultant_id, min_rating, max_rating } = req.query;

        const result = await AppointmentService.getAllFeedback(
            parseInt(page as string),
            parseInt(limit as string),
            consultant_id as string,
            min_rating ? parseInt(min_rating as string) : undefined,
            max_rating ? parseInt(max_rating as string) : undefined
        );

        res.json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get customer's feedback history
router.get('/my-feedback', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response) => {
    try {
        const user = req.jwtUser as JWTPayload;
        const result = await AppointmentRepository.getCustomerFeedbackHistory(user.userId, 1, 1000);
        const feedbackHistory = result.feedbacks.map(apt => ({
            appointment_id: apt._id,
            consultant_name: (apt.consultant_id as any).user_id?.full_name || 'Unknown',
            appointment_date: apt.appointment_date.toISOString(),
            start_time: apt.start_time,
            end_time: apt.end_time,
            feedback: {
                rating: apt.feedback!.rating,
                comment: apt.feedback!.comment,
                feedback_date: apt.feedback!.feedback_date.toISOString()
            }
        }));
        res.json({ success: true, data: feedbackHistory });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get customer's feedback history (alternative endpoint)
router.get('/my-feedbacks', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response) => {
    try {
        const user = req.jwtUser as JWTPayload;
        const result = await AppointmentRepository.getCustomerFeedbackHistory(user.userId, 1, 1000);
        const feedbackHistory = result.feedbacks.map(apt => ({
            appointment_id: apt._id,
            consultant_name: (apt.consultant_id as any).user_id?.full_name || 'Unknown',
            appointment_date: apt.appointment_date.toISOString(),
            start_time: apt.start_time,
            end_time: apt.end_time,
            feedback: {
                rating: apt.feedback!.rating,
                comment: apt.feedback!.comment,
                feedback_date: apt.feedback!.feedback_date.toISOString()
            }
        }));
        res.json({
            success: true,
            message: 'Customer feedback history retrieved successfully',
            data: {
                feedbacks: feedbackHistory,
                total: feedbackHistory.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get appointments for specific consultant (staff & admin can specify consultant_id)
router.get('/consultant/:consultantId', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
    try {
        const consultantId = req.params.consultantId;
        const { status, start_date, end_date } = req.query;

        const result = await AppointmentService.getConsultantAppointments(
            consultantId,
            status as string,
            start_date ? new Date(start_date as string) : undefined,
            end_date ? new Date(end_date as string) : undefined
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get consultant feedback statistics
router.get('/consultant/:consultantId/feedback-stats', authenticateToken, authorizeRoles('consultant', 'staff', 'admin'), async (req: Request, res: Response) => {
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
});

// ================== APPOINTMENT ACTIONS WITH ID PARAMETERS ==================

// Confirm appointment - Consultant only, BẮT BUỘC có Google Access Token
router.put('/:id/confirm', authenticateToken, authorizeRoles('consultant'), async (req: Request, res: Response) => {
    try {
        const appointmentId = req.params.id;
        const consultantUserId = req.jwtUser?.userId;
        const { googleAccessToken } = req.body;

        if (!consultantUserId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        // ✅ THÊM: Kiểm tra Google Access Token BẮT BUỘC
        if (!googleAccessToken) {
            return res.status(400).json({
                success: false,
                message: 'Google Access Token is required to create Google Meet link. Please authenticate with Google first.',
                requiresGoogleAuth: true,
                googleAuthUrl: `/api/auth/google`
            });
        }

        const result = await AppointmentService.confirmAppointment(
            appointmentId,
            consultantUserId,
            googleAccessToken
        );

        if (result.success) {
            res.status(200).json(result);
        } else {
            // ✅ THÊM: Handle requiresGoogleAuth response
            if (result.requiresGoogleAuth) {
                res.status(403).json({
                    ...result,
                    googleAuthUrl: `/api/auth/google`
                });
            } else {
                res.status(400).json(result);
            }
        }
    } catch (error: any) {
        console.error('Confirm appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error when confirming appointment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Cancel appointment - Customer, Consultant, Staff, Admin
router.put('/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
    try {
        const appointmentId = req.params.id;
        const requestUserId = req.jwtUser?.userId;
        const requestUserRole = req.jwtUser?.role;

        if (!requestUserId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const result = await AppointmentService.cancelAppointment(
            appointmentId,
            requestUserId,
            requestUserRole
        );

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Cancel appointment controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update appointment - Staff, Admin, có thể có Google Access Token
router.put('/:id', authenticateToken, authorizeRoles('staff', 'admin'), validateUpdateAppointment, async (req: Request, res: Response) => {
    try {
        const appointmentId = req.params.id;
        const requestUserId = req.jwtUser?.userId;
        const requestUserRole = req.jwtUser?.role;
        const { googleAccessToken, explicitAction, ...updateData } = req.body;

        if (!requestUserId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        // ✅ THÊM: Kiểm tra nếu explicitAction là 'confirmed' thì cần Google Access Token
        if (explicitAction === 'confirmed' && !googleAccessToken) {
            return res.status(400).json({
                success: false,
                message: 'Google Access Token is required when confirming appointments.',
                requiresGoogleAuth: true,
                googleAuthUrl: `/api/auth/google`
            });
        }

        // ✅ SỬA: Đúng thứ tự parameters
        const result = await AppointmentService.updateAppointment(
            appointmentId,
            updateData,
            requestUserId,
            requestUserRole,
            explicitAction,
            googleAccessToken
        );

        if (result.success) {
            res.status(200).json(result);
        } else {
            // ✅ THÊM: Handle requiresGoogleAuth response
            if (result.requiresGoogleAuth) {
                res.status(403).json({
                    ...result,
                    googleAuthUrl: `/api/auth/google`
                });
            } else {
                res.status(400).json(result);
            }
        }
    } catch (error: any) {
        console.error('Update appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error when updating appointment'
        });
    }
});

// Get appointment by ID - All authenticated users
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const appointmentId = req.params.id;
        const userId = req.jwtUser?.userId;
        const userRole = req.jwtUser?.role;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        // Get appointment
        const appointment = await AppointmentRepository.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check access permissions
        let hasAccess = false;

        if (userRole === 'staff' || userRole === 'admin') {
            hasAccess = true;
        } else if (userRole === 'customer') {
            hasAccess = appointment.customer_id.toString() === userId;
        } else if (userRole === 'consultant') {
            // For consultants, check if they own this appointment
            const consultant = await Consultant.findOne({ user_id: userId });
            if (consultant && appointment.consultant_id.toString() === consultant._id.toString()) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Appointment retrieved successfully',
            data: {
                appointment
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get appointment by ID controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ================== FEEDBACK ROUTES ==================

// Submit feedback for completed appointment (customer only)
router.post('/:appointmentId/feedback', authenticateToken, authorizeRoles('customer'), validateFeedback, async (req: Request, res: Response) => {
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
});

// Get feedback for appointment
router.get('/:appointmentId/feedback', authenticateToken, authorizeRoles('customer', 'consultant', 'staff', 'admin'), async (req: Request, res: Response) => {
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
});

// Check if customer can provide feedback
router.get('/:appointmentId/can-feedback', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response) => {
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
                message: 'You can only check feedback status for your own appointments'
            });
        }

        const canFeedback = appointment.status === 'completed' && !appointment.feedback;
        const reason = appointment.status !== 'completed'
            ? 'Appointment must be completed to provide feedback'
            : appointment.feedback
                ? 'Feedback has already been submitted'
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
});

// Update feedback (customer only, within 24 hours)
router.put('/:appointmentId/feedback', authenticateToken, authorizeRoles('customer'), validateFeedback, async (req: Request, res: Response) => {
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
});

// Delete feedback (customer only, within 24 hours)
router.delete('/:appointmentId/feedback', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response) => {
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

        // Remove feedback using dedicated repository method
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
});

// ================== APPOINTMENT ACTIONS ==================

// Get meeting info by appointment ID
router.get('/:appointmentId/meeting-info', authenticateToken, authorizeRoles('customer', 'consultant', 'staff', 'admin'), async (req: Request, res: Response) => {
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

        // Check access permissions similar to get appointment by ID
        let hasAccess = false;
        if (user.role === 'staff' || user.role === 'admin') {
            hasAccess = true;
        } else if (user.role === 'customer') {
            hasAccess = appointment.customer_id.toString() === user.userId;
        } else if (user.role === 'consultant') {
            const consultant = await Consultant.findOne({ user_id: user.userId });
            if (consultant && appointment.consultant_id.toString() === consultant._id.toString()) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

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
});

// Get appointment history
router.get('/:appointmentId/history', authenticateToken, authorizeRoles('customer', 'consultant', 'staff', 'admin'), async (req: Request, res: Response) => {
    try {
        const user = req.jwtUser as JWTPayload;
        const appointmentId = req.params.appointmentId;

        // Check if user has permission to view this appointment's history
        const appointment = await AppointmentRepository.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

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
});

// Start meeting
router.put('/:appointmentId/start-meeting', authenticateToken, authorizeRoles('customer', 'consultant'), async (req: Request, res: Response) => {
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
});

// Complete appointment
router.put('/:appointmentId/complete', authenticateToken, authorizeRoles('consultant', 'staff', 'admin'), async (req: Request, res: Response) => {
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
});

// Send meeting reminder
router.post('/:appointmentId/send-reminder', authenticateToken, authorizeRoles('consultant', 'staff', 'admin'), async (req: Request, res: Response) => {
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
});

export default router;