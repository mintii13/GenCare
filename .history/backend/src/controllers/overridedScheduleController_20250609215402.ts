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
                {
                    ...req.body,
                    date: new Date(req.body.date)
                }
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
            const updateData = req.body;
            if (updateData.date) {
                updateData.date = new Date(updateData.date);
            }
            const result = await OverridedScheduleService.updateOverride(
                user.role,
                req.params.id,
                updateData
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
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        const result = await OverridedScheduleService.getConsultantOverrides(
            req.params.consultantId,
            startDate,
            endDate
        );
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
router.get('/day/:consultantId', async (req, res) => {
    try {
        const date = new Date(req.query.date as string);
        const result = await OverridedScheduleService.getDaySchedule(
            req.params.consultantId,
            date
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