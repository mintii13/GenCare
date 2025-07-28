// controller/menstrualCycle.controller.ts
import { Router, Request, Response} from 'express';
import { MenstrualCycleService } from '../services/menstrualCycleService';
import { authenticateToken } from '../middlewares/jwtMiddleware';
import { 
    validateProcessMenstrualCycle, 
    validateCreateMoodData, 
    validateUpdateMoodData, 
    validateGetMoodData 
} from '../middlewares/menstrualCycleValidation';
import { sanitizeRequest } from '../middlewares/inputSanitizer';

const router = Router();

// ===== NEW MENSTRUAL CYCLE ENDPOINTS WITH MOOD DATA =====

// POST /api/menstrual-cycle/process - Process cycle with period day mood data
router.post('/process', 
    // sanitizeRequest(), // Temporarily disabled for debugging
    validateProcessMenstrualCycle,
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const result = await MenstrualCycleService.processCycleWithMoodData(user_id, req.body);
            
            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in /process:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'System error'
            });
        }
    }
);

// POST /api/menstrual-cycle/period-day/:date/mood - Create period day with mood data
router.post('/period-day/:date/mood',
    sanitizeRequest(),
    validateUpdateMoodData,
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const date = req.params.date;
            const mood_data = req.body.mood_data;

            const result = await MenstrualCycleService.createPeriodDayWithMood(user_id, date, mood_data);
            
            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in POST /period-day/:date/mood:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// PUT /api/menstrual-cycle/period-day/:date/mood - Update mood for specific period day
router.put('/period-day/:date/mood',
    sanitizeRequest(),
    validateUpdateMoodData,
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const date = req.params.date;
            const mood_data = req.body.mood_data;

            const result = await MenstrualCycleService.updatePeriodDayMood(user_id, date, mood_data);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in PUT /period-day/:date/mood:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/period-day/:date/mood - Get mood for specific period day
router.get('/period-day/:date/mood',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const date = req.params.date;

            const result = await MenstrualCycleService.getPeriodDayMood(user_id, date);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(404).json(result);
            }
        } catch (error) {
            console.error('Error in GET /period-day/:date/mood:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/statistics - Get cycle statistics with mood data
router.get('/statistics',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const cycle_id = req.query.cycle_id as string;

            const result = await MenstrualCycleService.getCycleMoodStatistics(user_id, cycle_id);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in GET /statistics:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/getCycleStatistics - Get comprehensive cycle statistics
router.get('/getCycleStatistics',
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
            console.error('Error in GET /getCycleStatistics:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/getPeriodStatistics - Get period statistics
router.get('/getPeriodStatistics',
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
            console.error('Error in GET /getPeriodStatistics:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/getMoodStatistics - Get mood statistics
router.get('/getMoodStatistics',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;

            const result = await MenstrualCycleService.getMoodStatistics(user_id);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in GET /getMoodStatistics:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/comparison - Get cycle comparison
router.get('/comparison',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;

            const result = await MenstrualCycleService.getCycleComparison(user_id);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in GET /comparison:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// ===== EXISTING ENDPOINTS (KEPT FOR BACKWARD COMPATIBILITY) =====

// POST /api/menstrual-cycle/processMenstrualCycle - Legacy endpoint
router.post('/processMenstrualCycle', 
    // sanitizeRequest(), // Temporarily disabled for debugging
    authenticateToken, 
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const period_days = req.body.period_days || [];
            const mood_data = req.body.mood_data || {};
            
            // Convert old format to new format
            const periodDayRequests = period_days.map((date: string) => ({
                date,
                mood_data: {
                    mood: 'neutral',
                    energy: 'medium',
                    symptoms: [],
                    notes: ''
                }
            }));

            const request = { period_days: periodDayRequests };
            const result = await MenstrualCycleService.processCycleWithMoodData(user_id, request);
            
            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in /processMenstrualCycle:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/getCycles - Get cycles
router.get('/getCycles', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        console.log('[Controller] GET /getCycles called with user_id:', user_id);
        console.log('[Controller] Request user object:', req.user);
        
        const result = await MenstrualCycleService.getCycles(user_id);
        
        console.log('[Controller] GET /getCycles result:', {
            success: result.success,
            dataLength: result.data?.length || 0,
            message: result.message
        });
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in GET /getCycles:', error);
        return res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

// GET /api/menstrual-cycle/today-status - Get today status
router.get('/today-status', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as any).userId;
        const result = await MenstrualCycleService.getTodayStatus(user_id);
        
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in GET /today-status:', error);
        return res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

// ===== MOOD DATA ENDPOINTS (KEPT FOR BACKWARD COMPATIBILITY) =====

// POST /api/menstrual-cycle/mood-data - Create mood data
router.post('/mood-data',
    // sanitizeRequest(), // Temporarily disabled for debugging
    validateCreateMoodData,
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            console.log('[POST /mood-data] Request body:', req.body);
            console.log('[POST /mood-data] Request headers:', req.headers);
            
            const user_id = (req.user as any).userId;
            const { date, mood_data } = req.body;

            console.log('[POST /mood-data] Extracted data:', { user_id, date, mood_data });

            const result = await MenstrualCycleService.updatePeriodDayMood(user_id, date, mood_data);
            
            console.log('[POST /mood-data] Service result:', result);
            
            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in POST /mood-data:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// PUT /api/menstrual-cycle/mood-data - Update mood data
router.put('/mood-data',
    sanitizeRequest(),
    validateUpdateMoodData,
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const { date, mood_data } = req.body;

            const result = await MenstrualCycleService.updatePeriodDayMood(user_id, date, mood_data);
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in PUT /mood-data:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/mood-data - Get mood data
router.get('/mood-data',
    validateGetMoodData,
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const { date, start_date, end_date } = req.query;

            if (date) {
                const result = await MenstrualCycleService.getPeriodDayMood(user_id, date as string);
                return res.status(result.success ? 200 : 404).json(result);
            } else if (start_date && end_date) {
                // Implement date range query
                const result = await MenstrualCycleService.getMoodDataByDateRange(
                    user_id, 
                    start_date as string, 
                    end_date as string
                );
                return res.status(result.success ? 200 : 404).json(result);
            } else {
                // Return all mood data for the user
                const result = await MenstrualCycleService.getAllMoodData(user_id);
                return res.status(result.success ? 200 : 404).json(result);
            }
        } catch (error) {
            console.error('Error in GET /mood-data:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// DELETE /api/menstrual-cycle/mood-data/:date - Delete mood data
router.delete('/mood-data/:date',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const date = req.params.date;

            // Set mood data to null/empty
            const emptyMoodData = {
                mood: 'neutral',
                energy: 'medium',
                symptoms: [],
                notes: ''
            };

            const result = await MenstrualCycleService.updatePeriodDayMood(user_id, date, emptyMoodData);
            
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Mood data deleted successfully'
                });
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in DELETE /mood-data/:date:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// GET /api/menstrual-cycle/mood-data/monthly-summary/:year/:month - Get monthly mood summary
router.get('/mood-data/monthly-summary/:year/:month',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const user_id = (req.user as any).userId;
            const year = parseInt(req.params.year);
            const month = parseInt(req.params.month);

            // Validate year and month
            if (isNaN(year) || year < 1900 || year > 2100) {
                return res.status(400).json({
                    success: false,
                    message: 'Năm không hợp lệ'
                });
            }

            if (isNaN(month) || month < 1 || month > 12) {
                return res.status(400).json({
                    success: false,
                    message: 'Tháng không hợp lệ'
                });
            }

            // For now, return a placeholder response
            return res.status(501).json({
                success: false,
                message: 'Monthly mood summary not implemented yet'
            });
        } catch (error) {
            console.error('Error in GET /mood-data/monthly-summary/:year/:month:', error);
            return res.status(500).json({
                success: false,
                message: 'System error'
            });
        }
    }
);

// Removed notification endpoint as it no longer exists in the service

// Removed old endpoints that no longer exist in the service

export default router;