import { Router, Request, Response } from 'express';
import { WeeklyScheduleService } from '../services/weeklyScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateWeeklySchedule, validateUpdateWeeklySchedule } from '../middlewares/weeklyScheduleValidation';

const router = Router();

// Tạo template lịch làm việc mới
router.post(
    '/',
    authenticateToken,
    authorizeRoles(['staff', 'admin']),
    validateCreateWeeklySchedule,
    async (req: Request, res: Response) => {
        const result = await WeeklyScheduleService.createSchedule(
            req.user.role,
            req.body
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

// Cập nhật template lịch làm việc
router.put(
    '/:scheduleId',
    authenticateToken,
    authorizeRoles(['staff', 'admin']),
    validateUpdateWeeklySchedule,
    async (req: Request, res: Response) => {
        const result = await WeeklyScheduleService.updateSchedule(
            req.user.role,
            req.params.scheduleId,
            req.body
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

// Lấy danh sách template lịch làm việc của consultant
router.get(
    '/consultant/:consultantId',
    authenticateToken,
    async (req: Request, res: Response) => {
        const includeInactive = req.query.includeInactive === 'true';
        const result = await WeeklyScheduleService.getConsultantSchedules(
            req.params.consultantId,
            includeInactive
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

// Vô hiệu hóa template lịch làm việc
router.delete(
    '/:scheduleId',
    authenticateToken,
    authorizeRoles(['staff', 'admin']),
    async (req: Request, res: Response) => {
        const result = await WeeklyScheduleService.deactivateSchedule(
            req.user.role,
            req.params.scheduleId
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

export default router; 