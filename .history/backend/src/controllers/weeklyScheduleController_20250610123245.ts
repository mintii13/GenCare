import { Router } from 'express';
import { WeeklyScheduleService } from '../services/weeklyScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateWeeklySchedule, validateUpdateWeeklySchedule } from '../middlewares/weeklyScheduleValidation';
import { JWTPayload } from '../utils/jwtUtils';
import { Consultant } from '../models/Consultant';

const router = Router();

// Helper function to get consultant context and created_by info
async function getConsultantContext(user: JWTPayload, requestedConsultantId?: string): Promise<{
    consultantId: string | null,
    createdBy: { user_id: string, role: string, name: string } | null,
    error: string | null
}> {
    if (user.role === 'consultant') {
        // Consultant chỉ được manage schedule của chính mình
        const consultant = await Consultant.findOne({ user_id: user.userId }).populate('user_id', 'full_name');
        if (!consultant) {
            return { consultantId: null, createdBy: null, error: 'Consultant profile not found' };
        }

        const createdBy = {
            user_id: user.userId,
            role: user.role,
            name: (consultant.user_id as any).full_name
        };

        return { consultantId: consultant._id.toString(), createdBy, error: null };
    } else if (user.role === 'staff' || user.role === 'admin') {
        // Staff/admin có thể manage schedule của consultant khác
        if (!requestedConsultantId) {
            return { consultantId: null, createdBy: null, error: 'Consultant ID is required for staff/admin' };
        }

        // Get user info for created_by
        const { User } = require('../models/User');
        const userInfo = await User.findById(user.userId).select('full_name');

        const createdBy = {
            user_id: user.userId,
            role: user.role,
            name: userInfo?.full_name || 'Unknown'
        };

        return { consultantId: requestedConsultantId, createdBy, error: null };
    } else {
        return { consultantId: null, createdBy: null, error: 'Unauthorized role' };
    }
}

// Create weekly schedule for a specific week
router.post(
    '/',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    validateCreateWeeklySchedule,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const { consultantId, createdBy, error } = await getConsultantContext(user, req.body.consultant_id);

            if (error || !consultantId || !createdBy) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Invalid consultant context'
                });
            }

            // Validate week_start_date
            if (!req.body.week_start_date) {
                return res.status(400).json({
                    success: false,
                    message: 'week_start_date is required'
                });
            }

            const weekStartDate = new Date(req.body.week_start_date);

            // Ensure it's a Monday
            if (weekStartDate.getDay() !== 1) {
                return res.status(400).json({
                    success: false,
                    message: 'week_start_date must be a Monday'
                });
            }

            // Add consultant_id and created_by to request body
            req.body.consultant_id = consultantId;
            req.body.week_start_date = weekStartDate;
            req.body.created_by = createdBy;

            const schedule = await WeeklyScheduleService.createSchedule(req.body);

            if (schedule.success) {
                res.status(201).json(schedule);
            } else {
                res.status(400).json(schedule);
            }
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
    '/:scheduleId',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    validateUpdateWeeklySchedule,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const scheduleId = req.params.scheduleId;

            // Verify ownership for consultant role
            if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant) {
                    return res.status(400).json({
                        success: false,
                        message: 'Consultant profile not found'
                    });
                }

                // Check if the schedule belongs to this consultant
                const existingSchedule = await WeeklyScheduleService.getScheduleById(scheduleId);
                if (!existingSchedule.success || existingSchedule.data?.schedule.consultant_id.toString() !== consultant._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only update your own schedule'
                    });
                }
            }

            // Validate week_start_date if provided
            if (req.body.week_start_date) {
                const weekStartDate = new Date(req.body.week_start_date);
                if (weekStartDate.getDay() !== 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'week_start_date must be a Monday'
                    });
                }
                req.body.week_start_date = weekStartDate;
            }

            const schedule = await WeeklyScheduleService.updateSchedule(scheduleId, req.body);

            if (schedule.success) {
                res.json(schedule);
            } else {
                res.status(400).json(schedule);
            }
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get schedules for a consultant
router.get(
    '/consultant/:consultantId',
    authenticateToken,
    authorizeRoles('consultant', 'customer', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const requestedConsultantId = req.params.consultantId;

            // Verify access rights
            if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant || consultant._id.toString() !== requestedConsultantId) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view your own schedules'
                    });
                }
            }

            const { start_date, end_date } = req.query;
            const schedules = await WeeklyScheduleService.getConsultantSchedules(
                requestedConsultantId,
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            if (schedules.success) {
                res.json(schedules);
            } else {
                res.status(400).json(schedules);
            }
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get own schedules (for consultant)
router.get(
    '/my-schedules',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const consultant = await Consultant.findOne({ user_id: user.userId });

            if (!consultant) {
                return res.status(400).json({
                    success: false,
                    message: 'Consultant profile not found'
                });
            }

            const { start_date, end_date } = req.query;
            const schedules = await WeeklyScheduleService.getConsultantSchedules(
                consultant._id.toString(),
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            res.json(schedules);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get all schedules (staff & admin only)
router.get(
    '/all',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            const { start_date, end_date, consultant_id } = req.query;

            const schedules = await WeeklyScheduleService.getAllSchedules(
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined,
                consultant_id as string
            );

            if (schedules.success) {
                res.json(schedules);
            } else {
                res.status(400).json(schedules);
            }
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
    '/:scheduleId',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const scheduleId = req.params.scheduleId;