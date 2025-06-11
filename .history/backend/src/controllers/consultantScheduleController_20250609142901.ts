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
// Consultant: chỉ