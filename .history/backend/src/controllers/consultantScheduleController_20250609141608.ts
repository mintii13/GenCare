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
    UpdateScheduleRequest,
    GetScheduleQuery,
    GetAvailabilityQuery
} from '../dto/requests/ConsultantScheduleRequest';
import mongoose from 'mongoose';

const router = Router();

// POST /api/consultant/schedule - Tạo lịch làm việc
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
router.get(
    '/schedule',
    authenticateToken,
    authorizeRoles('consultant'),
    validateGetScheduleQuery,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req.user as any).userId;

            // Debug log để kiểm tra query parameters
            console.log('Controller - req.query:', req.query);
            console.log('Controller - req.query type:', typeof req.query);

            // Lấy query parameters và cast về string
            const start_date = req.query.start_date as string;
            const end_date = req.query.end_date as string;

            console.log('Controller - start_date:', start_date, 'type:', typeof start_date);
            console.log('Controller - end_date:', end_date, 'type:', typeof end_date);

            const result = await ConsultantScheduleService.getSchedules(
                userId,
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
router.put(
    '/schedule/:scheduleId',
    authenticateToken,
    authorizeRoles('consultant'),
    validateUpdateSchedule,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req.user as any).userId;
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
                scheduleId,
                updateData
            );

            if (result.success) {
                res.status(200).json(result);
            } else if (result.message === 'Schedule not found') {
                res.status(404).json(result);
            } else if (result.message === 'You can only update your own schedules') {
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
router.delete(
    '/schedule/:scheduleId',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req.user as any).userId;
            const { scheduleId } = req.params;

            // Validate scheduleId
            if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid schedule ID'
                });
                return;
            }

            const result = await ConsultantScheduleService.deleteSchedule(userId, scheduleId);

            if (result.success) {
                res.status(200).json(result);
            } else if (result.message === 'Schedule not found') {
                res.status(404).json(result);
            } else if (result.message === 'You can only delete your own schedules') {
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