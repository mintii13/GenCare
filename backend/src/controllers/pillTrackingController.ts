import { Router, Request, Response} from 'express';
import { GetScheduleRequest, SetupPillTrackingRequest, UpdateScheduleRequest } from '../dto/requests/PillTrackingRequest';
import { PillTrackingService } from '../services/pillTrackingService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
const router = Router();

router.post('/setup', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const TIMEZONE = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';
        const pill_start_date = DateTime.now().setZone(TIMEZONE).startOf('day').toISO();
        const requestData: SetupPillTrackingRequest = {
            userId: (req.user as any).userId,
            pill_type: req.body.pill_type,
            pill_start_date,
            reminder_time: req.body.reminder_time,
            reminder_enabled: req.body.reminder_enabled,
            max_reminder_times: req.body.max_reminder_times,
            reminder_interval: req.body.reminder_interval,
        };

        const result = await PillTrackingService.setupPillTracking(requestData);

        if (!result.success) {
            res.status(400).json(result);
        } else {
            res.status(201).json(result);
        }
    } catch (error) {
        console.error('Error in /setup:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

router.get('/weekly', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const start_date = req.query.start_date as string;
        const user_id = (req.user as any).userId;
        const result = await PillTrackingService.getWeeklyPillTracking(user_id, start_date);
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Internal server error'
        });
    }
})

router.patch('/mark-as-taken/:id', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const pill_tracking_id = req.params.id;
        const taken_time = req.body.taken_time;

        if (!taken_time) {
            res.status(400).json({
                success: false, 
                message: 'is_taken is required' 
            });
            return;
        }

        const result = await PillTrackingService.markPillAsTaken(pill_tracking_id, taken_time);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

router.get('/statistics', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = req.jwtUser.userId;
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing user_id'
            });
        }

        const result = await PillTrackingService.getPillStatistics(user_id);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
})

router.get('/:userId', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
        const pillSchedule: GetScheduleRequest = {userId, startDate, endDate};
        const result = await PillTrackingService.getUserPillSchedule(pillSchedule);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

router.patch('/:userId', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
        try {
            const user_id = req.params.userId;
            const {is_taken, reminder_enabled, reminder_time, is_active, pill_type, max_reminder_times, reminder_interval} = req.body;
            if (is_taken === undefined && is_active === undefined && reminder_enabled === undefined && !reminder_time && 
                !pill_type && max_reminder_times === undefined && reminder_interval === undefined) {
                res.status(400).json({
                    success: false,
                    message: 'No updatable fields provided'
                });
                return;
            }
            const updateRequest: UpdateScheduleRequest = {user_id};

            if (is_taken != null){
                updateRequest.is_taken = is_taken;
            }
            if (is_active != null){
                updateRequest.is_active = is_active;
            }
            if (reminder_enabled !== undefined) 
                updateRequest.reminder_enabled = reminder_enabled;
            if (reminder_time) 
                updateRequest.reminder_time = reminder_time;
            if (pill_type) 
                updateRequest.pill_type = pill_type;
            if (max_reminder_times !== undefined) 
                updateRequest.max_reminder_times = max_reminder_times;
            if (reminder_interval !== undefined) 
                updateRequest.reminder_interval = reminder_interval;
            const result = await PillTrackingService.updatePillSchedule(updateRequest);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
})
export default router