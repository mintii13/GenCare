import { Router, Request, Response } from 'express';
import { OverridedScheduleService } from '../services/overridedScheduleService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateOverride, validateUpdateOverride } from '../middlewares/overridedScheduleValidation';

const router = Router();

// Tạo override cho một ngày cụ thể
router.post(
    '/',
    authenticateToken,
    authorizeRoles(['staff', 'admin']),
    validateCreateOverride,
    async (req: Request, res: Response) => {
        const result = await OverridedScheduleService.createOverride(
            req.user.role,
            {
                ...req.body,
                date: new Date(req.body.date)
            }
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

// Cập nhật override
router.put(
    '/:overrideId',
    authenticateToken,
    authorizeRoles(['staff', 'admin']),
    validateUpdateOverride,
    async (req: Request, res: Response) => {
        const updateData = req.body;
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }

        const result = await OverridedScheduleService.updateOverride(
            req.user.role,
            req.params.overrideId,
            updateData
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

// Lấy danh sách override của consultant
router.get(
    '/consultant/:consultantId',
    authenticateToken,
    async (req: Request, res: Response) => {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        const result = await OverridedScheduleService.getConsultantOverrides(
            req.params.consultantId,
            startDate,
            endDate
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

// Xóa override
router.delete(
    '/:overrideId',
    authenticateToken,
    authorizeRoles(['staff', 'admin']),
    async (req: Request, res: Response) => {
        const result = await OverridedScheduleService.deleteOverride(
            req.user.role,
            req.params.overrideId
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

// Lấy thông tin lịch làm việc của một ngày cụ thể
router.get(
    '/day/:consultantId',
    authenticateToken,
    async (req: Request, res: Response) => {
        const date = new Date(req.query.date as string);
        const result = await OverridedScheduleService.getDaySchedule(
            req.params.consultantId,
            date
        );
        res.status(result.success ? 200 : 400).json(result);
    }
);

export default router; 