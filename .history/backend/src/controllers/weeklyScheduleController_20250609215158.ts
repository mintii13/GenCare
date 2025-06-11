import express from 'express';
import { WeeklyScheduleService } from '../services/weeklyScheduleService';
import { validateCreateWeeklySchedule, validateUpdateWeeklySchedule } from '../middlewares/weeklyScheduleValidation';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { IUser } from '../models/User';

const router = express.Router();
const weeklyScheduleService = new WeeklyScheduleService();

// Create a new weekly schedule
router.post('/',
    authorizeRoles(['staff', 'admin']),
    validateCreateWeeklySchedule,
    async (req, res) => {
        try {
            const user = req.user as IUser;
            const schedule = await weeklyScheduleService.createSchedule({
                ...req.body,
                created_by: user._id
            });
            res.status(201).json({
                success: true,
                data: schedule
            });
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
            const schedule = await weeklyScheduleService.updateSchedule(
                req.params.id,
                {
                    ...req.body,
                    updated_by: user._id
                }
            );
            res.json({
                success: true,
                data: schedule
            });
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
        const schedule = await weeklyScheduleService.getScheduleById(req.params.id);
        res.json({
            success: true,
            data: schedule
        });
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
        const schedules = await weeklyScheduleService.getSchedulesByConsultantId(req.params.consultantId);
        res.json({
            success: true,
            data: schedules
        });
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
            await weeklyScheduleService.deleteSchedule(req.params.id, user._id);
            res.json({
                success: true,
                message: 'Schedule deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete schedule'
            });
        }
    }
);

export default router; 