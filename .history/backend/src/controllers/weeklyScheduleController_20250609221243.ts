import { Router } from 'express';
import { WeeklyScheduleService } from '../services/weeklyScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateWeeklySchedule, validateUpdateWeeklySchedule } from '../middlewares/weeklyScheduleValidation';

const router = Router();

// Create weekly schedule
router.post(
    '/',
    authenticateToken,
    authorizeRoles('consultant'),
    validateCreateWeeklySchedule,
    async (req, res) => {
        try {
            const consultantId = req.user?.userId;
            const schedule = await WeeklyScheduleService.createSchedule(consultantId, req.body);
            res.status(201).json({
                success: true,
                data: schedule
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Update weekly schedule
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('consultant'),
    validateUpdateWeeklySchedule,
    async (req, res) => {
        try {
            const consultantId = req.user?.userId;
            const schedule = await WeeklyScheduleService.updateSchedule(
                req.params.id,
                consultantId,
                req.body
            );
            res.json({
                success: true,
                data: schedule
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get consultant's weekly schedule
router.get(
    '/consultant/:consultantId',
    authenticateToken,
    authorizeRoles('consultant', 'customer'),
    async (req, res) => {
        try {
            const schedule = await WeeklyScheduleService.getConsultantSchedules(req.params.consultantId);
            res.json({
                success: true,
                data: schedule
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Delete weekly schedule
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req, res) => {
        try {
            const consultantId = req.user?.userId;
            await WeeklyScheduleService.deactivateSchedule(req.params.id, consultantId);
            res.json({
                success: true,
                message: 'Lịch làm việc đã được xóa'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

export default router; 