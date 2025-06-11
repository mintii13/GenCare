import express from 'express';
import { OverridedScheduleService } from '../services/overridedScheduleService';
import { validateCreateOverridedSchedule, validateUpdateOverridedSchedule } from '../middlewares/overridedScheduleValidation';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { IUser } from '../models/User';

const router = express.Router();

// Create a new override schedule
router.post('/',
    authorizeRoles(['staff', 'admin']),
    validateCreateOverridedSchedule,
    async (req, res) => {
        try {
            const user = req.user as IUser;
            const result = await OverridedScheduleService.createOverride(
                user.role,
                req.body
            );
            res.status(result.success ? 201 : 400).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create override schedule'
            });
        }
    }
);

// Update an override schedule
router.put('/:id',
    authorizeRoles(['staff', 'admin']),
    validateUpdateOverridedSchedule,
    async (req, res) => {
        try {
            const user = req.user as IUser;
            const result = await OverridedScheduleService.updateOverride(
                user.role,
                req.params.id,
                req.body
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update override schedule'
            });
        }
    }
);

// Get an override schedule by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await OverridedScheduleService.getOverrideById(req.params.id);
        res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : 'Override schedule not found'
        });
    }
});

// Get all override schedules for a consultant
router.get('/consultant/:consultantId', async (req, res) => {
    try {
        const result = await OverridedScheduleService.getOverridesByConsultantId(req.params.consultantId);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get override schedules'
        });
    }
});

// Delete an override schedule
router.delete('/:id',
    authorizeRoles(['staff', 'admin']),
    async (req, res) => {
        try {
            const user = req.user as IUser;
            const result = await OverridedScheduleService.deleteOverride(
                user.role,
                req.params.id
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete override schedule'
            });
        }
    }
);

// Get working schedule for a specific day
router.get('/working-day/:consultantId', async (req, res) => {
    try {
        const date = req.query.date as string;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date parameter is required'
            });
        }

        const result = await OverridedScheduleService.getWorkingScheduleForDay(
            req.params.consultantId,
            new Date(date)
        );
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get working schedule'
        });
    }
});

export default router; 