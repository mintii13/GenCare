import { Router } from 'express';
import { WeeklyScheduleService } from '../services/weeklyScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateWeeklySchedule, validateUpdateWeeklySchedule } from '../middlewares/weeklyScheduleValidation';
import { JWTPayload } from '../utils/jwtUtils';

const router = Router();

// Create weekly schedule - ONLY STAFF & ADMIN
router.post(
    '/',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    validateCreateWeeklySchedule,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;

            const schedule = await WeeklyScheduleService.createSchedule(req.body);

            if (schedule.success) {
                res.status(201).json(schedule);
            } else {
                res.status(400).json(schedule);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Update weekly schedule - ONLY STAFF & ADMIN
router.put(
    '/:consultantId',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    validateUpdateWeeklySchedule,
    async (req, res) => {
        try {
            const consultantId = req.params.consultantId;

            const schedule = await WeeklyScheduleService.updateSchedule(consultantId, req.body);

            if (schedule.success) {
                res.json(schedule);
            } else {
                res.status(400).json(schedule);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get consultant's weekly schedule - STAFF & ADMIN CAN VIEW ALL, CONSULTANT CAN VIEW OWN ONLY
router.get(
    '/consultant/:consultantId',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const requestedConsultantId = req.params.consultantId;

            // Verify access rights
            if (user.role === 'consultant') {
                // Consultant can only view their own schedule
                const { Consultant } = require('../models/Consultant');
                const consultant = await Consultant.findOne({ user_id: user.userId });

                if (!consultant || consultant._id.toString() !== requestedConsultantId) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view your own schedule'
                    });
                }
            }

            const schedule = await WeeklyScheduleService.getConsultantSchedule(requestedConsultantId);

            if (schedule.success) {
                res.json(schedule);
            } else {
                res.status(400).json(schedule);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get own schedule (for consultant) - CONSULTANT ONLY
router.get(
    '/my-schedule',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const { Consultant } = require('../models/Consultant');
            const consultant = await Consultant.findOne({ user_id: user.userId });

            if (!consultant) {
                return res.status(400).json({
                    success: false,
                    message: 'Consultant profile not found'
                });
            }

            const schedule = await WeeklyScheduleService.getConsultantSchedule(consultant._id.toString());
            res.json(schedule);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get all schedules - STAFF & ADMIN ONLY
router.get(
    '/all',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            const schedules = await WeeklyScheduleService.getAllSchedules();

            if (schedules.success) {
                res.json(schedules);
            } else {
                res.status(400).json(schedules);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Delete weekly schedule - ONLY STAFF & ADMIN
router.delete(
    '/:consultantId',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            const consultantId = req.params.consultantId;

            const result = await WeeklyScheduleService.deleteSchedule(consultantId);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

export default router;