import { Router } from 'express';
import { WeeklyScheduleService } from '../services/weeklyScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateWeeklySchedule, validateUpdateWeeklySchedule } from '../middlewares/weeklyScheduleValidation';
import { JWTPayload } from '../utils/jwtUtils';
import { Consultant } from '../models/Consultant';

const router = Router();

// Helper function to get consultant ID
async function getConsultantId(user: JWTPayload, requestedConsultantId?: string): Promise<{ consultantId: string | null, error: string | null }> {
    if (user.role === 'consultant') {
        // Consultant chỉ được manage schedule của chính mình
        const consultant = await Consultant.findOne({ user_id: user.userId });
        if (!consultant) {
            return { consultantId: null, error: 'Consultant profile not found' };
        }
        return { consultantId: consultant._id.toString(), error: null };
    } else if (user.role === 'staff' || user.role === 'admin') {
        // Staff/admin có thể manage schedule của consultant khác
        if (!requestedConsultantId) {
            return { consultantId: null, error: 'Consultant ID is required for staff/admin' };
        }
        return { consultantId: requestedConsultantId, error: null };
    } else {
        return { consultantId: null, error: 'Unauthorized role' };
    }
}

// Create weekly schedule
router.post(
    '/',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    validateCreateWeeklySchedule,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const { consultantId, error } = await getConsultantId(user, req.body.consultant_id);

            if (error || !consultantId) {
                return res.status(400).json({
                    success: false,
                    message: error || 'Invalid consultant ID'
                });
            }

            // Ensure consultant_id in body matches resolved consultantId
            req.body.consultant_id = consultantId;

            const schedule = await WeeklyScheduleService.createSchedule(user.role, req.body);

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

// Update weekly schedule
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    validateUpdateWeeklySchedule,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const scheduleId = req.params.id;

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

            const schedule = await WeeklyScheduleService.updateSchedule(user.role, scheduleId, req.body);

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

// Get consultant's weekly schedule
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
                        message: 'You can only view your own schedule'
                    });
                }
            }

            const schedule = await WeeklyScheduleService.getConsultantSchedules(requestedConsultantId);

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

// Get own schedule (for consultant)
router.get(
    '/my-schedule',
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

            const schedule = await WeeklyScheduleService.getConsultantSchedules(consultant._id.toString());
            res.json(schedule);
        } catch (error: any) {
            res.status(500).json({
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
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const scheduleId = req.params.id;

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
                        message: 'You can only delete your own schedule'
                    });
                }
            }

            const result = await WeeklyScheduleService.deactivateSchedule(user.role, scheduleId);

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