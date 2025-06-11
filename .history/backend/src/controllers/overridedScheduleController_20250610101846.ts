import { Router } from 'express';
import { OverridedScheduleService } from '../services/overridedScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateOverridedSchedule, validateUpdateOverridedSchedule } from '../middlewares/overridedScheduleValidation';
import { JWTPayload } from '../utils/jwtUtils';
import { Consultant } from '../models/Consultant';

const router = Router();

// Helper function to get consultant ID and created_by info
async function getConsultantContext(user: JWTPayload, requestedConsultantId?: string): Promise<{
    consultantId: string | null,
    createdBy: { user_id: string, role: string, name: string } | null,
    error: string | null
}> {
    if (user.role === 'consultant') {
        // Consultant chỉ được manage override của chính mình
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
        // Staff/admin có thể manage override của consultant khác
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

// Create override schedule
router.post(
    '/',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    validateCreateOverridedSchedule,
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

            // Add consultant_id and created_by to request body
            req.body.consultant_id = consultantId;
            req.body.created_by = createdBy;

            const override = await OverridedScheduleService.createOverride(req.body);

            if (override.success) {
                res.status(201).json(override);
            } else {
                res.status(400).json(override);
            }
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
    authorizeRoles('consultant', 'staff', 'admin'),
    validateUpdateOverridedSchedule,
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const overrideId = req.params.id;

            // Verify ownership for consultant role
            if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant) {
                    return res.status(400).json({
                        success: false,
                        message: 'Consultant profile not found'
                    });
                }

                // Check if the override belongs to this consultant
                const existingOverride = await OverridedScheduleService.getOverrideById(overrideId);
                if (!existingOverride.success || existingOverride.data?.schedule.consultant_id.toString() !== consultant._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only update your own override'
                    });
                }
            }

            const override = await OverridedScheduleService.updateOverride(overrideId, req.body);

            if (override.success) {
                res.json(override);
            } else {
                res.status(400).json(override);
            }
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
                        message: 'You can only view your own overrides'
                    });
                }
            }

            const { start_date, end_date } = req.query;
            const overrides = await OverridedScheduleService.getConsultantOverrides(
                requestedConsultantId,
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            if (overrides.success) {
                res.json(overrides);
            } else {
                res.status(400).json(overrides);
            }
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get own overrides (for consultant)
router.get(
    '/my-overrides',
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
            const overrides = await OverridedScheduleService.getConsultantOverrides(
                consultant._id.toString(),
                start_date ? new Date(start_date as string) : undefined,
                end_date ? new Date(end_date as string) : undefined
            );

            res.json(overrides);
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
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as JWTPayload;
            const overrideId = req.params.id;

            // Verify ownership for consultant role
            if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant) {
                    return res.status(400).json({
                        success: false,
                        message: 'Consultant profile not found'
                    });
                }

                // Check if the override belongs to this consultant
                const existingOverride = await OverridedScheduleService.getOverrideById(overrideId);
                if (!existingOverride.success || existingOverride.data?.schedule.consultant_id.toString() !== consultant._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only delete your own override'
                    });
                }
            }

            const result = await OverridedScheduleService.deleteOverride(overrideId);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
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
    authorizeRoles('consultant', 'customer', 'staff', 'admin'),
    async (req, res) => {
        try {
            const { date } = req.query;
            if (!date || typeof date !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Ngày là bắt buộc'
                });
            }

            const schedule = await OverridedScheduleService.getDaySchedule(
                req.params.consultantId,
                new Date(date)
            );

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

export default router;