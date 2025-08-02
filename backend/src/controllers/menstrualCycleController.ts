// controller/menstrualCycle.controller.ts
import { Router, Request, Response} from 'express';
import { MenstrualCycleService } from '../services/menstrualCycleService';
import { authenticateToken } from '../middlewares/jwtMiddleware';

const router = Router();

// ===== MENSTRUAL CYCLE ENDPOINTS =====

// POST /api/menstrual-cycle/process - Process cycle with period days
router.post('/process', 
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const { period_days } = req.body;
            
            if (!period_days || !Array.isArray(period_days)) {
                        return res.status(400).json({
            success: false,
            message: 'period_days phải là một mảng các chuỗi ngày'
        });
            }
            
            const result = await MenstrualCycleService.processCycle(user_id, period_days);
            
            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in /process:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi hệ thống'
            });
        }
    }
);

// GET /api/menstrual-cycle/cycles - Get all cycles for user
router.get('/cycles', 
    authenticateToken, 
    async (req: Request, res: Response) => {
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
                message: 'Lỗi hệ thống'
            });
        }
    }
);

// GET /api/menstrual-cycle/today - Get today's status
router.get('/today', 
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const result = await MenstrualCycleService.getTodayStatus(user_id);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in GET /today:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

// GET /api/menstrual-cycle/statistics - Get cycle statistics
router.get('/statistics', 
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const result = await MenstrualCycleService.getCycleStatistics(user_id);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in GET /statistics:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

// GET /api/menstrual-cycle/period-statistics - Get period statistics
router.get('/period-statistics', 
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const result = await MenstrualCycleService.getPeriodStatistics(user_id);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in GET /period-statistics:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// DELETE /api/menstrual-cycle/period-day/:date - Delete a specific period day
router.delete('/period-day/:date', 
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const dateToDelete = req.params.date;
            
            // Validate date format
            const date = new Date(dateToDelete);
            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng ngày không hợp lệ'
                });
            }
            
            const result = await MenstrualCycleService.deletePeriodDay(user_id, dateToDelete);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in DELETE /period-day/:date:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

// GET /api/menstrual-cycle/pregnancy-detection - Detect potential pregnancy
router.get('/pregnancy-detection', 
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const result = await MenstrualCycleService.detectPotentialPregnancy(user_id);
            
            return res.status(200).json({
                success: true,
                message: 'Kiểm tra thai kỳ thành công',
                data: result
            });
        } catch (error) {
            console.error('Error in GET /pregnancy-detection:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

// DELETE /api/menstrual-cycle/cycle/:cycleId - Delete a specific cycle
router.delete('/cycle/:cycleId', 
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const cycleId = req.params.cycleId;
            
            const result = await MenstrualCycleService.deleteCycle(user_id, cycleId);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in DELETE /cycle/:cycleId:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

export default router;