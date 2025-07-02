import { Router, Request, Response} from 'express';
import { PillTypes } from '../models/PillTracking';
import { GetScheduleRequest, SetupPillTrackingRequest, UpdateScheduleRequest } from '../dto/requests/PillTrackingRequest';
import { PillTrackingService } from '../services/pillTrackingService';
import { authenticateToken } from '../middlewares/jwtMiddleware';
const router = Router();

router.post('/setupPillTracking', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const user_id = (req.user as any).userId;
        const {pill_type, pill_start_date, reminder_time, reminder_enabled } = req.body;
        const pillTracking: SetupPillTrackingRequest = {
            userId: user_id,
            pill_type: pill_type as PillTypes,
            pill_start_date: pill_start_date,
            reminder_time: reminder_time,
            reminder_enabled: reminder_enabled
        };

        const result = await PillTrackingService.setupPillTracking(pillTracking);

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'System error',
        });
    }
});

router.get('/getPillTrackingByUser/:userId', async (req: Request, res: Response): Promise<void> => {
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

router.patch('/updatePillTrackingByUser/:userId', async (req: Request, res: Response): Promise<void> => {
        try {
            const user_id = req.params.userId;
            const {is_taken, reminder_enabled, reminder_time, is_active, pill_type} = req.body;
            if (is_taken === undefined && is_active === undefined && reminder_enabled === undefined && !reminder_time && !pill_type) {
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
            const result = await PillTrackingService.updatePillSchedule(updateRequest);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
})
export default router