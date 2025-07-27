// controller/menstrualCycle.controller.ts
import { Router, Request, Response} from 'express';
import { MenstrualCycleService } from '../services/menstrualCycleService';
import { authenticateToken } from '../middlewares/jwtMiddleware';
import { validateMenstrualCycle, groupPeriodDays } from '../middlewares/menstrualCycleValidation';

const router = Router();

router.post('/processMenstrualCycle', validateMenstrualCycle, groupPeriodDays, authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const grouped_period_days = req.body.grouped_period_days;
        console.log('Received grouped_period_days:', grouped_period_days);
        const notes = req.body.notes || '';
        // Validation đã được thực hiện ở middleware, nhưng thêm safety check
        if (!grouped_period_days || !Array.isArray(grouped_period_days) || grouped_period_days.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'grouped period days are not valid or empty'
            });
        }
        // Flatten grouped_period_days back to flat array for service
        const flatPeriodDays = grouped_period_days.flat();
        const result = await MenstrualCycleService.processPeriodDays(user_id, flatPeriodDays, notes);
        
        if (!Array.isArray(result) && result.success === false) {
            return res.status(400).json(result);
        }
        return res.status(201).json(result);
    } catch (error) {
        console.error('Error in /processMenstrualCycle:', error);
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
        } else {4
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

router.get('/cleanupDuplicates', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const result = await MenstrualCycleService.cleanupDuplicates(user_id);
        
        if (result.success === false) {
            return res.status(400).json(result);
        }
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in /cleanupDuplicates:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'System error during cleanup'
        });
    }
});

router.delete('/resetAllData', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const result = await MenstrualCycleService.resetAllData(user_id);
        
        if (result.success === false) {
            return res.status(400).json(result);
        }
        
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in /resetAllData:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'System error during reset'
        });
    }
});

// Route removed - method not implemented

export default router;