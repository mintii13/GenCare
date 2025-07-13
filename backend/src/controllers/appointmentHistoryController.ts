import { Router, Request, Response } from 'express';
import { AppointmentHistoryService } from '../services/appointmentHistoryService';
import { AppointmentHistoryQuery } from '../dto/requests/AppointmentHistoryRequest';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validatePaginationQuery } from '../middlewares/paginationValidation';
import {
    validateAppointmentHistoryQuery,
    validateCleanupHistory,
    validateStatsQuery
} from '../middlewares/appointmentHistoryValidation';
import { AppointmentRepository } from '../repositories/appointmentRepository';
import { Consultant } from '../models/Consultant';
import { AppointmentHistory } from '../models/AppointmentHistory';
import { PaginationUtils } from '../utils/paginationUtils';
import { User } from '../models/User';
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
 * GET /api/appointment-history/list
 * Lấy danh sách appointment history với pagination và filtering
 */
router.get('/list',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    validatePaginationQuery,
    validateAppointmentHistoryQuery,
    async (req: Request, res: Response) => {
        try {
            const query: AppointmentHistoryQuery = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10,
                sort_by: req.query.sort_by as string || 'timestamp',
                sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc',

                // Filter parameters
                appointment_id: req.query.appointment_id as string,
                action: req.query.action as 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' | 'started',
                performed_by_user_id: req.query.performed_by_user_id as string,
                performed_by_role: req.query.performed_by_role as 'customer' | 'consultant' | 'staff' | 'admin',
                date_from: req.query.date_from as string,
                date_to: req.query.date_to as string
            };

            const result = await AppointmentHistoryService.getAppointmentHistoryWithPagination(query);

            if (!result.success) {
                return res.status(500).json(result);
            }

            // Manually populate nested fields if the repository layer fails to do so
            if (result.data && result.data.appointment_histories) {
                
                for (let i = 0; i < result.data.appointment_histories.length; i++) {
                    const history = result.data.appointment_histories[i];
                    const appointmentId = history.appointment_id as any; // Cast to any for property access
                    
                    if (appointmentId && appointmentId.customer_id) {
                        try {
                            const customer = await User.findById(appointmentId.customer_id).select('full_name email').lean();
                            if (customer) {
                                appointmentId.customer_id = customer;
                            }
                        } catch (e: any) { 
                        }
                    }

                    if (appointmentId && appointmentId.consultant_id) {
                        try {
                            const consultant = await Consultant.findById(appointmentId.consultant_id)
                                .populate({
                                    path: 'user_id',
                                    select: 'full_name email'
                                })
                                .lean();
                            if (consultant) {
                                appointmentId.consultant_id = consultant;
                                const consultantUser = (consultant as any).user_id;
                            }
                         } catch (e: any) { 
                         }
                    }
                }
            }

            return res.status(200).json(result);
        } catch (error) {
                    console.error('Get appointment history list error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/appointment-history/appointment/:appointmentId
 * Lấy lịch sử của một appointment cụ thể
 * MOVED FROM appointmentController.ts - with proper permission check
 */
router.get('/appointment/:appointmentId',
    authenticateToken,
    authorizeRoles('customer', 'consultant', 'staff', 'admin'),
    async (req: Request, res: Response) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const { appointmentId } = req.params;

            if (!appointmentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Appointment ID is required'
                });
            }

            // ✅ THÊM: Permission check như trong appointmentController cũ
            if (user.role === 'customer' || user.role === 'consultant') {
                const appointment = await AppointmentRepository.findById(appointmentId);
                if (!appointment) {
                    return res.status(404).json({
                        success: false,
                        message: 'Appointment not found'
                    });
                }

                // Check permission for customer
                if (user.role === 'customer') {
                    let customerIdToCheck: string;
                    if (typeof appointment.customer_id === 'string') {
                        customerIdToCheck = appointment.customer_id;
                    } else if (appointment.customer_id && typeof appointment.customer_id === 'object') {
                        // If populated, get _id from populated object
                        customerIdToCheck = (appointment.customer_id as any)._id?.toString() || (appointment.customer_id as any).toString();
                    } else {
                        customerIdToCheck = appointment.customer_id?.toString() || '';
                    }

                    if (customerIdToCheck !== user.userId) {
                        return res.status(403).json({
                            success: false,
                            message: 'You can only view history of your own appointments'
                        });
                    }
                }

                // Check permission for consultant
                if (user.role === 'consultant') {
                    const consultant = await Consultant.findOne({ user_id: user.userId });
                    if (!consultant) {
                        return res.status(400).json({
                            success: false,
                            message: 'Consultant profile not found'
                        });
                    }

                    let consultantIdToCheck: string;
                    if (typeof appointment.consultant_id === 'string') {
                        consultantIdToCheck = appointment.consultant_id;
                    } else if (appointment.consultant_id && typeof appointment.consultant_id === 'object') {
                        // If populated, get _id from populated object
                        consultantIdToCheck = (appointment.consultant_id as any)._id?.toString() || (appointment.consultant_id as any).toString();
                    } else {
                        consultantIdToCheck = appointment.consultant_id?.toString() || '';
                    }

                    if (consultantIdToCheck !== consultant._id.toString()) {
                        return res.status(403).json({
                            success: false,
                            message: 'You can only view history of your own appointments'
                        });
                    }
                }
            }

            const result = await AppointmentHistoryService.getAppointmentHistory(appointmentId);

            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    appointment_id: appointmentId,
                    history: result.data?.history
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get appointment history error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/appointment-history/user/:userId
 * Lấy lịch sử hoạt động của một user với pagination
 */
router.get('/user/:userId',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    validatePaginationQuery,
    async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const sort_by = req.query.sort_by as string || 'timestamp';
            const sort_order = req.query.sort_order as 'asc' | 'desc' || 'desc';

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            // Validate user ID format
            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }

            const result = await AppointmentHistoryService.getUserActivityHistoryWithPagination(
                userId,
                page,
                limit,
                sort_by,
                sort_order
            );

            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Get user activity history error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/appointment-history/stats/actions
 * Lấy thống kê theo actions
 */
router.get('/stats/actions',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    validateStatsQuery,
    async (req: Request, res: Response) => {
        try {
            const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
            const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

            const result = await AppointmentHistoryService.getActionStats(startDate, endDate);

            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Get action stats error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/appointment-history/stats/roles
 * Lấy thống kê theo roles
 */
router.get('/stats/roles',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    validateStatsQuery,
    async (req: Request, res: Response) => {
        try {
            const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
            const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

            const result = await AppointmentHistoryService.getRoleStats(startDate, endDate);

            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Get role stats error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * GET /api/appointment-history/recent
 * Lấy hoạt động gần đây
 */
router.get('/recent',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await AppointmentHistoryService.getRecentActivity(limit);

            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Get recent activity error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * DELETE /api/appointment-history/cleanup
 * Dọn dẹp lịch sử cũ (chỉ admin)
 */
router.delete('/cleanup',
    authenticateToken,
    authorizeRoles('admin'),
    validateCleanupHistory,
    async (req: Request, res: Response) => {
        try {
            const { before_date } = req.body;

            if (!before_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Before date is required'
                });
            }

            const beforeDate = new Date(before_date);

            if (isNaN(beforeDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format'
                });
            }

            const result = await AppointmentHistoryService.cleanupOldHistory(beforeDate);

            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Cleanup old history error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

export default router;