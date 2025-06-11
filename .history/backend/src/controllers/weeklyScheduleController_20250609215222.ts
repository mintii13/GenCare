import express from 'express';
import { WeeklyScheduleService } from '../services/weeklyScheduleService';
import { validateCreateWeeklySchedule, validateUpdateWeeklySchedule } from '../middlewares/weeklyScheduleValidation';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { IUser } from '../models/User';

const router = express.Router();

// Create a new weekly schedule
router.post('/',
    authorizeRoles(['staff', 'admin']),
    validateCreateWeeklySchedule,
    async (req, res) => {
        try {
            const user = req.user as IUser;
            const result = await WeeklyScheduleService.createSchedule(
                user.role,
                req.body
            );
            res.status(result.success ? 201 : 400).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create schedule'
            });
        }
    }
);

// Update a weekly schedule
router.put('/:id',
    authorizeRoles(['staff', 'admin']),
    validateUpdateWeeklySchedule,
    async (req, res) => {
        try {
            const user = req.user as IUser;
            const result = await WeeklyScheduleService.updateSchedule(
                user.role,
                req.params.id,
                req.body
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update schedule'
            });
        }
    }
);

// Get a weekly schedule by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await WeeklyScheduleService.getConsultantSchedules(req.params.id);
        res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : 'Schedule not found'
        });
    }
});

// Get all weekly schedules for a consultant
router.get('/consultant/:consultantId', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const result = await WeeklyScheduleService.getConsultantSchedules(
            req.params.consultantId,
            includeInactive
        );
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get schedules'
        });
    }
});

// Delete a weekly schedule
router.delete('/:id',
    authorizeRoles(['staff', 'admin']),
    async (req, res) => {
        try {
            const user = req.user as IUser;
            const result = await WeeklyScheduleService.deactivateSchedule(
                user.role,
                req.params.id
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete schedule'
            });
        }
    }
);

export default router; 