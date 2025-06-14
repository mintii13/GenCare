import { Router } from 'express';
import { ConsultantService } from '../services/consultantService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';

const router = Router();

// GET /api/consultants - Lấy danh sách tất cả các chuyên gia (chỉ staff và admin)
router.get(
    '/',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req, res) => {
        try {
            // Lấy tham số phân trang từ query string, với giá trị mặc định
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 1000;

            // Debug logging
            console.log(`[DEBUG] GET /api/consultants - page: ${page}, limit: ${limit}`);
            console.log(`[DEBUG] User role: ${(req as any).jwtUser?.role}`);
            console.log(`[DEBUG] User ID: ${(req as any).jwtUser?.userId}`);

            const result = await ConsultantService.getAllConsultants(page, limit);

            console.log(`[DEBUG] Service result success: ${result.success}`);
            if (result.success && result.data) {
                console.log(`[DEBUG] Number of consultants returned: ${result.data.consultants?.length || 0}`);
            }

            if (result.success) {
                res.status(200).json(result);
            } else {
                console.log(`[DEBUG] Service returned error: ${result.message}`);
                res.status(400).json(result);
            }
        } catch (error: any) {
            console.error(`[DEBUG] Controller error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

export default router; 