import { Router, Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { AppointmentRepository } from '../repositories/appointmentRepository';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { Consultant } from '../models/Consultant';
import { AppointmentHistoryService } from '../services/appointmentHistoryService';
import { validateBookAppointment, validateUpdateAppointment, validateFeedback } from '../middlewares/appointmentValidation';
import { AppointmentQuery } from '../dto/requests/PaginationRequest';
import { validatePaginationQuery, validateAppointmentQuery } from '../middlewares/paginationValidation';

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
/**
 * GET /api/appointments - TẤT CẢ APPOINTMENT LOGIC TRONG 1 ENDPOINT
 * - Automatic role-based filtering
 * - Pagination support
 * - Search & filtering
 * - Date range filtering
 */
router.get('/',
    authenticateToken,
    validatePaginationQuery,
    validateAppointmentQuery,
    async (req: Request, res: Response) => {
        try {
            const user = req.jwtUser as JWTPayload;

            // Nếu có pagination parameters thì dùng pagination logic
            if (req.query.page || req.query.limit || req.query.search ||
                req.query.status || req.query.appointment_date_from || req.query.appointment_date_to ||
                req.query.start_date || req.query.end_date) {

                const query: AppointmentQuery = {
                    page: parseInt(req.query.page as string) || 1,
                    limit: parseInt(req.query.limit as string) || 10,
                    search: req.query.search as string,
                    customer_id: req.query.customer_id as string,
                    consultant_id: req.query.consultant_id as string,
                    status: req.query.status as any,

                    // THÊM: Support cả 2 format date filtering
                    appointment_date_from: req.query.appointment_date_from as string || req.query.start_date as string,
                    appointment_date_to: req.query.appointment_date_to as string || req.query.end_date as string,

                    video_call_status: req.query.video_call_status as any,
                    has_feedback: req.query.has_feedback === 'true' ? true : req.query.has_feedback === 'false' ? false : undefined,
                    feedback_rating: req.query.feedback_rating ? parseInt(req.query.feedback_rating as string) : undefined,
                    sort_by: req.query.sort_by as any || 'appointment_date',
                    sort_order: req.query.sort_order as any || 'desc'
                };

                // AUTOMATIC ROLE-BASED FILTERING
                if (user.role === 'customer') {
                    query.customer_id = user.userId; // Customer chỉ thấy appointments của mình
                } else if (user.role === 'consultant') {
                    // Tìm consultant_id từ database
                    const consultant = await Consultant.findOne({ user_id: user.userId });
                    if (!consultant) {
                        return res.status(400).json({
                            success: false,
                            message: 'Consultant profile not found'
                        });
                    }
                    query.consultant_id = consultant._id.toString(); // Consultant chỉ thấy appointments của mình
                }
                // Staff/Admin có thể thấy tất cả (không override filters)

                console.log('Appointment query:', query);

                const result = await AppointmentService.getAppointmentsWithPagination(query);

                if (result.success) {
                    res.status(200).json(result);
                } else {
                    res.status(500).json(result);
                }
                return;
            }

            // FALLBACK: Nếu không có pagination params thì dùng old logic để backward compatible
            const { status, start_date, end_date } = req.query;

            if (user.role === 'customer') {
                const result = await AppointmentService.getCustomerAppointments(
                    user.userId,
                    status as string,
                    start_date ? new Date(start_date as string) : undefined,
                    end_date ? new Date(end_date as string) : undefined
                );
                res.status(200).json(result);
            } else if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant) {
                    return res.status(400).json({
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
            } else {
                // Staff/Admin - get all appointments với basic filtering
                const result = await AppointmentService.getAllAppointments(
                    status as string,
                    start_date ? new Date(start_date as string) : undefined,
                    end_date ? new Date(end_date as string) : undefined
                );
                res.status(200).json(result);
            }
        } catch (error) {
            console.error('Get appointments controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

// ================================
// SEARCH ENDPOINT (CÓ THỂ GIỮ HOẶC XÓA - TÙY BẠN)
// ================================

/**
 * GET /api/appointments/search - Search appointments (OPTIONAL - có thể xóa vì đã có trong main endpoint)
 */
router.get('/search',
    authenticateToken,
    validatePaginationQuery,
    validateAppointmentQuery,
    async (req: Request, res: Response) => {
        try {
            if (!req.query.search) {
                return res.status(400).json({
                    success: false,
                    message: 'Search parameter is required'
                });
            }

            const user = req.jwtUser as JWTPayload;

            const query: AppointmentQuery = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10,
                search: req.query.search as string,
                customer_id: req.query.customer_id as string,
                consultant_id: req.query.consultant_id as string,
                status: req.query.status as any,
                appointment_date_from: req.query.appointment_date_from as string || req.query.start_date as string,
                appointment_date_to: req.query.appointment_date_to as string || req.query.end_date as string,
                sort_by: req.query.sort_by as any || 'appointment_date',
                sort_order: req.query.sort_order as any || 'desc'
            };

            // Role-based filtering
            if (user.role === 'customer') {
                query.customer_id = user.userId;
            } else if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant) {
                    return res.status(400).json({
                        success: false,
                        message: 'Consultant profile not found'
                    });
                }
                query.consultant_id = consultant._id.toString();
            }

            const result = await AppointmentService.getAppointmentsWithPagination(query);
            res.status(200).json(result);
        } catch (error) {
            console.error('Search appointments controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * GET /api/appointments/statistics - Get appointment statistics
 */
router.get('/statistics',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req: Request, res: Response) => {
        try {
            // Optional filters for statistics
            const filters: any = {};

            if (req.query.consultant_id) {
                filters.consultant_id = req.query.consultant_id;
            }

            if (req.query.date_from || req.query.date_to) {
                filters.appointment_date = {};
                if (req.query.date_from) {
                    filters.appointment_date.$gte = new Date(req.query.date_from as string);
                }
                if (req.query.date_to) {
                    const endDate = new Date(req.query.date_to as string);
                    endDate.setHours(23, 59, 59, 999);
                    filters.appointment_date.$lte = endDate;
                }
            }

            const result = await AppointmentService.getAppointmentStatistics(filters);
            res.status(200).json(result);
        } catch (error) {
            console.error('Get appointment statistics controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);
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

// Update appointment - Customer, Staff, Admin, có thể có Google Access Token
router.put('/:id', authenticateToken, authorizeRoles('customer', 'staff', 'admin'), validateUpdateAppointment, async (req: Request, res: Response) => {
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
// ================================
// DEBUG VERSION - Thêm console.log để debug
// ================================

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
            // IMPROVED: Handle different customer_id formats
            let customerIdToCheck: string;
            if (typeof appointment.customer_id === 'string') {
                customerIdToCheck = appointment.customer_id;
            } else if (appointment.customer_id && typeof appointment.customer_id === 'object') {
                // If populated, get _id from populated object
                customerIdToCheck = (appointment.customer_id as any)._id?.toString() || appointment.customer_id.toString();
            } else {
                customerIdToCheck = appointment.customer_id?.toString() || '';
            }
            hasAccess = customerIdToCheck === userId;
        } else if (userRole === 'consultant') {

            // For consultants, check if they own this appointment
            const consultant = await Consultant.findOne({ user_id: userId });
            if (consultant) {
                // IMPROVED: Handle different consultant_id formats
                let consultantIdToCheck: string;
                if (typeof appointment.consultant_id === 'string') {
                    consultantIdToCheck = appointment.consultant_id;
                } else if (appointment.consultant_id && typeof appointment.consultant_id === 'object') {
                    // If populated, get _id from populated object  
                    consultantIdToCheck = (appointment.consultant_id as any)._id?.toString() || appointment.consultant_id.toString();
                } else {
                    consultantIdToCheck = appointment.consultant_id?.toString() || '';
                }
                hasAccess = consultantIdToCheck === consultant._id.toString();
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