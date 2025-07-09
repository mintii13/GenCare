import { Router, Request, Response } from 'express';
import { StiAssessmentService } from '../services/stiAssessmentService';
import { validateStiAssessment } from '../middlewares/stiAssessmentValidation';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateObjectId } from '../middlewares/blogValidation';

const router = Router();

/**
 * POST /api/sti-assessment/create
 * Tạo đánh giá STI mới cho customer
 */
router.post('/create',
    authenticateToken,
    authorizeRoles('customer'),
    validateStiAssessment,
    async (req: Request, res: Response) => {
        try {
            const userId = req.jwtUser?.userId || (req.user as any)?.userId;
            console.log('STI Assessment controller - userId:', userId);
            console.log('STI Assessment controller - req.body:', JSON.stringify(req.body, null, 2));

            if (!userId) {
                console.error('No userId found in request');
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const assessmentData = req.body;
            console.log('Calling StiAssessmentService.createAssessment...');
            const result = await StiAssessmentService.createAssessment(userId, assessmentData);
            console.log('Service result:', result);

            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in create STI assessment controller:', error);
            console.error('Error stack:', (error as Error).stack);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống: ' + (error as Error).message
            });
        }
    }
);

/**
 * GET /api/sti-assessment/history
 * Lấy lịch sử đánh giá STI của customer hiện tại
 */
router.get('/history',
    authenticateToken,
    authorizeRoles('customer'),
    async (req: Request, res: Response) => {
        try {
            const userId = req.jwtUser?.userId || (req.user as any)?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const result = await StiAssessmentService.getAssessmentHistory(userId);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in get assessment history:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * GET /api/sti-assessment/:id
 * Lấy chi tiết đánh giá STI theo ID
 */
router.get('/:id',
    authenticateToken,
    authorizeRoles('customer', 'staff', 'admin'),
    validateObjectId('id'),
    async (req: Request, res: Response) => {
        try {
            const assessmentId = req.params.id;
            const userId = req.jwtUser?.userId || (req.user as any)?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const result = await StiAssessmentService.getAssessmentById(assessmentId);

            if (result.success) {
                return res.status(200).json(result);
            } else if (result.message === 'Assessment not found') {
                return res.status(404).json(result);
            } else if (result.message === 'Unauthorized access') {
                return res.status(403).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in get assessment by ID:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * PUT /api/sti-assessment/:id
 * Cập nhật đánh giá STI (chỉ cho staff/admin)
 */
router.put('/:id',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    validateObjectId('id'),
    validateStiAssessment,
    async (req: Request, res: Response) => {
        try {
            const assessmentId = req.params.id;
            const userId = req.jwtUser?.userId || (req.user as any)?.userId;
            const updateData = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const result = await StiAssessmentService.updateAssessment(assessmentId, updateData, userId);

            if (result.success) {
                return res.status(200).json(result);
            } else if (result.message === 'Assessment not found') {
                return res.status(404).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in update assessment:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * DELETE /api/sti-assessment/:id
 * Xóa đánh giá STI (chỉ cho admin)
 */
router.delete('/:id',
    authenticateToken,
    authorizeRoles('admin'),
    validateObjectId('id'),
    async (req: Request, res: Response) => {
        try {
            const assessmentId = req.params.id;
            const userId = req.jwtUser?.userId || (req.user as any)?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const result = await StiAssessmentService.deleteAssessment(assessmentId, userId);

            if (result.success) {
                return res.status(200).json(result);
            } else if (result.message === 'Assessment not found') {
                return res.status(404).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in delete assessment:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * GET /api/sti-assessment/stats/overview
 * Thống kê tổng quan đánh giá STI (cho staff/admin)
 */
router.get('/stats/overview',
    authenticateToken,
    authorizeRoles('staff', 'admin'),
    async (req: Request, res: Response) => {
        try {
            const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
            const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

            const result = await StiAssessmentService.getAssessmentStats(startDate, endDate);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in get assessment stats:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * GET /api/sti-assessment/packages/info
 * Lấy thông tin tất cả các gói xét nghiệm STI
 * Public endpoint
 */
router.get('/packages/info', async (req: Request, res: Response) => {
    try {
        const result = await StiAssessmentService.getAllPackageInfo();

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error in get package info:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

export default router;