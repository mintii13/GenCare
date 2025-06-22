// controller/menstrualCycle.controller.ts
import { Router, Request, Response} from 'express';
import { MenstrualCycleService } from '../services/menstrualCycleService';
import { authenticateToken } from '../middlewares/jwtMiddleware';

const router = Router();

router.post('/processMenstrualCycle', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const period_days = req.body.period_days.map((day: string) => new Date(day));
        const notes = req.body.notes;
        const result = await MenstrualCycleService.processPeriodDays(user_id, period_days, notes);
        if (!Array.isArray(result) && result.success === false)
            return res.status(400).json(result);
        return res.status(201).json(result);
    } catch (error) {
        console.error('Error in /processPeriodDays:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'System error'
        });
    }
});

// GET /api/cycles - Lấy danh sách chu kỳ
router.get('/getCycles', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const result = await MenstrualCycleService.getCycles(user_id);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in GET /cycles:', error);
        return res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

// GET /api/cycles/month/:year/:month - Lấy chu kỳ theo tháng
router.get('/getCyclesByMonth/:year/:month', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        
        const result = await MenstrualCycleService.getCyclesByMonth(user_id, year, month);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in GET /cycles/month:', error);
        return res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

router.patch('/updateNotificationStatus', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const settings = req.body;
        
        const result = await MenstrualCycleService.updateNotificationSettings(user_id, settings);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in PUT /updateNotificationStatus:', error);
        return res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

router.get('/getTodayStatus', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const result = await MenstrualCycleService.getTodayStatus(user_id);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in GET /cycles/today:', error);
        return res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

//statistics
router.get('/getCycleStatistics', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const result = await MenstrualCycleService.getCycleStats(user_id);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in GET /analytics/cycle-stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê chu kỳ'
        });
    }
});

// GET /api/analytics/period-stats - Thống kê kinh nguyệt
router.get('/getPeriodStatistics', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const result = await MenstrualCycleService.getPeriodStats(user_id);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in GET /analytics/period-stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê kinh nguyệt'
        });
    }
});
export default router;