import { Router } from 'express';
import { OverridedScheduleService } from '../services/overridedScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateOverridedSchedule, validateUpdateOverridedSchedule } from '../middlewares/overridedScheduleValidation';

const router = Router();

// Create override schedule
router.post(
    '/',
    authenticateToken,
    authorizeRoles('consultant'),
    validateCreateOverridedSchedule,
    async (req, res) => {
        try {
            const consultantId = req.user?.id;
            const override = await OverridedScheduleService.createOverride(consultantId, req.body);
            res.status(201).json({
                success: true,
                data: override
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Update override schedule
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('consultant'),
    validateUpdateOverridedSchedule,
    async (req, res) => {
        try {
            const consultantId = req.user?.id;
            const override = await OverridedScheduleService.updateOverride(
                req.params.id,
                consultantId,
                req.body
            );
            res.json({
                success: true,
                data: override
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get all overrides for a consultant
router.get(
    '/consultant/:consultantId',
    authenticateToken,
    authorizeRoles('consultant', 'customer'),
    async (req, res) => {
        try {
            const overrides = await OverridedScheduleService.getOverridesByConsultantId(req.params.consultantId);
            res.json({
                success: true,
                data: overrides
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Delete override schedule
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req, res) => {
        try {
            const consultantId = req.user?.id;
            await OverridedScheduleService.deleteOverride(req.params.id, consultantId);
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

// Get working schedule for a specific day
router.get(
    '/working-schedule/:consultantId',
    authenticateToken,
    authorizeRoles('consultant', 'customer'),
    async (req, res) => {
        try {
            const { date } = req.query;
            if (!date || typeof date !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Ngày là bắt buộc'
                });
            }

            const schedule = await OverridedScheduleService.getWorkingScheduleForDay(
                req.params.consultantId,
                new Date(date)
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

export default router; 