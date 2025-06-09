import { Router, Request, Response } from 'express';
import { ConsultantScheduleService } from '../services/consultantScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import {
    validateCreateSchedule,
    validateUpdateSchedule,
    validateGetScheduleQuery,
    validateGetAvailabilityQuery
} from '../middlewares/consultantScheduleValidation';
import {
    CreateScheduleRequest,
    UpdateScheduleRequest
} from '../dto/requests/ConsultantScheduleRequest';
import mongoose from 'mongoose';

const router = Router();

// POST /api/consultant/schedule - Tạo lịch làm việc (chỉ consultant)
router.post(
    '/schedule',
    authenticateToken,
    authorizeRoles('consultant'),
    validateCreateSchedule,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req.user as any).userId;
            const scheduleData: CreateScheduleRequest = req.body;

            const result = await ConsultantScheduleService.createSchedule(userId, scheduleData);

            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Create schedule controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

// GET /api/consultant/schedule - Lấy danh sách lịch làm việc
// Consultant: chỉ xem schedule của mình
// Staff/Admin: có thể xem tất cả hoặc của consultant cụ thể
router.get(
    '/schedule',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    validateGetScheduleQuery,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req.user as any).userId;
            const userRole = (req.user as any).role;

            const start_date = req.query.start_date as string;
            const end_date = req.query.end_date as string;
            const consultant_id = req.query.consultant_id as string; // Cho staff/admin xem schedule của consultant cụ thể

            const result = await ConsultantScheduleService.getSchedules(
                userId,
                userRole,
                consultant_id,
                start_date,
                end_date
            );

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Get schedules controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

// PUT /api/consultant/schedule/:scheduleId - Cập nhật lịch làm việc
// Consultant: chỉ update schedule của mình
// Staff/Admin: có thể update tất cả schedules
router.put(
    '/schedule/:scheduleId',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    validateUpdateSchedule,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req.user as any).userId;
            const userRole = (req.user as any).role;
            const { scheduleId } = req.params;
            const updateData: UpdateScheduleRequest = req.body;

            // Validate scheduleId
            if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID'
                });
                return;
            }

            const result = await ConsultantScheduleService.updateSchedule(
                userId,
                userRole,
                scheduleId,
                updateData
            );

            if (result.success) {
                res.status(200).json(result);
            } else if (result.message === 'Schedule not found') {
                res.status(404).json(result);
            } else if (result.message.includes('permission')) {
                res.status(403).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Update schedule controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

// DELETE /api/consultant/schedule/:scheduleId - Xóa lịch làm việc
// Consultant: chỉ delete schedule của mình
// Staff/Admin: có thể delete tất cả schedules
router.delete(
    '/schedule/:scheduleId',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req.user as any).userId;
            const userRole = (req.user as any).role;
            const { scheduleId } = req.params;

            // Validate scheduleId
            if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID'
                });
                return;
            }

            const result = await ConsultantScheduleService.deleteSchedule(userId, userRole, scheduleId);

            if (result.success) {
                res.status(200).json(result);
            } else if (result.message === 'Schedule not found') {
                res.status(404).json(result);
            } else if (result.message.includes('permission')) {
                res.status(403).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Delete schedule controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

// GET /api/consultant/:consultantId/availability - Lấy slot thời gian có sẵn
// Tất cả user đã đăng nhập đều có thể xem availability
router.get(
    '/:consultantId/availability',
    authenticateToken,
    validateGetAvailabilityQuery,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { consultantId } = req.params;
            const date = req.query.date as string;

            if (!date) {
                res.status(400).json({
                    success: false,
                    message: 'Date parameter is required'
                });
                return;
            }

            // Validate consultantId
            if (!mongoose.Types.ObjectId.isValid(consultantId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid consultant ID'
                });
                return;
            }

            const result = await ConsultantScheduleService.getAvailableTimeSlots(
                consultantId,
                date
            );

            if (result.success) {
                res.status(200).json(result);
            } else if (result.message === 'Consultant not found') {
                res.status(404).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Get availability controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

// GET /api/consultant/my-info - Lấy thông tin consultant của user hiện tại
router.get(
    '/my-info',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req.user as any).userId;

            const consultant = await ConsultantScheduleService.getConsultantByUserId(userId);

            if (!consultant) {
                res.status(404).json({
                    success: false,
                    message: 'Consultant profile not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Consultant info retrieved successfully',
                data: {
                    consultant: {
                        consultant_id: consultant._id,
                        user_id: consultant.user_id,
                        specialization: consultant.specialization,
                        qualifications: consultant.qualifications,
                        experience_years: consultant.experience_years,
                        consultation_rating: consultant.consultation_rating,
                        total_consultations: consultant.total_consultations
                    }
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get consultant info controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

export default router;