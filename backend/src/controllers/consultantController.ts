import { Router } from 'express';
import { ConsultantService } from '../services/consultantService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { AppointmentService } from '../services/appointmentService';
import { Consultant } from '../models/Consultant';
const router = Router();

// GET /api/consultants/public - Lấy danh sách công khai các chuyên gia (không cần đăng nhập)
router.get(
    '/public',
    async (req, res) => {
        try {
            // Lấy tham số phân trang từ query string, với giá trị mặc định
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 1000;

            // Debug logging
            console.log(`[DEBUG] GET /api/consultants/public - page: ${page}, limit: ${limit}`);

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

// GET /api/consultants/public/:consultantId - Lấy thông tin công khai của một chuyên gia (không cần đăng nhập)
router.get(
    '/public/:consultantId',
    async (req, res) => {
        try {
            const consultantId = req.params.consultantId;

            console.log(`[DEBUG] GET /api/consultants/public/${consultantId}`);

            const result = await ConsultantService.getConsultantById(consultantId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(404).json(result);
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

// GET /api/consultants - Lấy danh sách tất cả các chuyên gia (cho phép customer, staff và admin)
router.get(
    '/',
    authenticateToken,
    authorizeRoles('customer', 'staff', 'admin'),
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
// Get top rated consultants (public endpoint)
router.get(
    '/top-rated',
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit as string) || 5;

            console.log(`[DEBUG] GET /api/consultants/top-rated - limit: ${limit}`);

            const result = await ConsultantService.getTopRatedConsultants(limit);

            if (result.success) {
                res.status(200).json(result);
            } else {
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

// Get consultant performance summary (consultant can view own, staff/admin can view all)
router.get(
    '/:consultantId/performance',
    authenticateToken,
    authorizeRoles('consultant', 'staff', 'admin'),
    async (req, res) => {
        try {
            const user = req.jwtUser as any;
            const consultantId = req.params.consultantId;

            console.log(`[DEBUG] GET /api/consultants/${consultantId}/performance`);

            // Check permission for consultant role
            if (user.role === 'consultant') {
                const consultant = await Consultant.findOne({ user_id: user.userId });
                if (!consultant || consultant._id.toString() !== consultantId) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only view your own performance summary'
                    });
                }
            }

            const result = await ConsultantService.getConsultantPerformanceSummary(consultantId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(404).json(result);
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

// Get own performance summary (for consultant)
router.get(
    '/my-performance',
    authenticateToken,
    authorizeRoles('consultant'),
    async (req, res) => {
        try {
            const user = req.jwtUser as any;

            console.log(`[DEBUG] GET /api/consultants/my-performance - user: ${user.userId}`);

            // Find consultant profile
            const consultant = await Consultant.findOne({ user_id: user.userId });
            if (!consultant) {
                return res.status(400).json({
                    success: false,
                    message: 'Consultant profile not found'
                });
            }

            const result = await ConsultantService.getConsultantPerformanceSummary(
                consultant._id.toString()
            );

            res.json(result);
        } catch (error: any) {
            console.error(`[DEBUG] Controller error: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Get consultant feedback stats (public endpoint for basic stats)
router.get(
    '/:consultantId/feedback-stats-public',
    async (req, res) => {
        try {
            const consultantId = req.params.consultantId;

            console.log(`[DEBUG] GET /api/consultants/${consultantId}/feedback-stats-public`);

            // Get basic feedback stats without detailed comments
            const result = await AppointmentService.getConsultantFeedbackStats(
                consultantId,
                'public', // Special indicator for public access
                'public'
            );

            if (result.success) {
                // Remove sensitive data for public endpoint
                const publicData = {
                    consultant_id: result.data?.consultant_id,
                    consultant_name: result.data?.consultant_name,
                    total_feedbacks: result.data?.total_feedbacks,
                    average_rating: result.data?.average_rating,
                    rating_distribution: result.data?.rating_distribution,
                    // Remove recent_feedbacks for privacy
                };

                res.status(200).json({
                    success: true,
                    message: 'Public feedback statistics retrieved successfully',
                    data: publicData,
                    timestamp: new Date().toISOString()
                });
            } else {
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

// Get consultants with filtering and sorting by rating
router.get(
    '/search',
    async (req, res) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const minRating = req.query.min_rating ? parseFloat(req.query.min_rating as string) : undefined;
            const specialization = req.query.specialization as string;
            const sortBy = req.query.sort_by as string || 'rating'; // 'rating', 'experience', 'name'

            console.log(`[DEBUG] GET /api/consultants/search - filters:`, {
                page, limit, minRating, specialization, sortBy
            });

            // Validate parameters
            if (minRating !== undefined && (minRating < 1 || minRating > 5)) {
                return res.status(400).json({
                    success: false,
                    message: 'Minimum rating must be between 1 and 5'
                });
            }

            // Get all consultants first
            const allConsultants = await ConsultantService.getAllConsultants(1, 1000);

            if (!allConsultants.success) {
                return res.status(400).json(allConsultants);
            }

            let consultants = allConsultants.data?.consultants || [];

            // Apply filters
            if (minRating !== undefined) {
                consultants = consultants.filter((c: any) => c.consultation_rating >= minRating);
            }

            if (specialization) {
                consultants = consultants.filter((c: any) =>
                    c.specialization.toLowerCase().includes(specialization.toLowerCase())
                );
            }

            // Apply sorting
            switch (sortBy) {
                case 'rating':
                    consultants.sort((a: any, b: any) => b.consultation_rating - a.consultation_rating);
                    break;
                case 'experience':
                    consultants.sort((a: any, b: any) => b.experience_years - a.experience_years);
                    break;
                case 'name':
                    consultants.sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));
                    break;
                case 'total_consultations':
                    consultants.sort((a: any, b: any) => b.total_consultations - a.total_consultations);
                    break;
                default:
                    // Default to rating
                    consultants.sort((a: any, b: any) => b.consultation_rating - a.consultation_rating);
            }

            // Apply pagination
            const totalItems = consultants.length;
            const totalPages = Math.ceil(totalItems / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedConsultants = consultants.slice(startIndex, endIndex);

            res.status(200).json({
                success: true,
                message: 'Filtered consultants retrieved successfully',
                data: {
                    consultants: paginatedConsultants,
                    pagination: {
                        current_page: page,
                        total_pages: totalPages,
                        total_items: totalItems,
                        items_per_page: limit
                    },
                    filters_applied: {
                        min_rating: minRating,
                        specialization: specialization,
                        sort_by: sortBy
                    }
                },
                timestamp: new Date().toISOString()
            });
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