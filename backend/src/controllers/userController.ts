// src/controllers/userController.ts
import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { CreateUserRequest, UpdateUserRequest, UserQuery } from '../dto/requests/UserRequest';
import { validateCreateUser, validateUpdateUser } from '../middlewares/userValidation';

const router = Router();

/**
 * GET /api/users - Get all users with pagination, search và filters (Admin/Staff only)
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'staff'), async (req: Request, res: Response) => {
    try {
        const query: UserQuery = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 10,
            search: req.query.search as string,
            role: req.query.role as 'customer' | 'consultant' | 'staff' | 'admin',
            status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
            email_verified: req.query.email_verified !== undefined ? req.query.email_verified === 'true' : undefined,
            date_from: req.query.date_from as string,
            date_to: req.query.date_to as string,
            sort_by: req.query.sort_by as string || 'registration_date',
            sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc'
        };

        const result = await UserService.getUsersWithPagination(query);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách người dùng'
        });
    }
});

router.get('/staffs', authenticateToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
        const result = await UserService.getAllUsersByRole('staff');

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Get all staffs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
});

router.get('/consultants', authenticateToken, authorizeRoles('admin', 'staff'), async (req: Request, res: Response) => {
    try {
        const result = await UserService.getAllUsersByRole('consultant');

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Get all consultants error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
});

router.get('/customers', authenticateToken, authorizeRoles('admin', 'staff'), async (req: Request, res: Response) => {
    try {
        const result = await UserService.getAllUsersByRole('customer');

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Get all consultants error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
});

/**
 * GET /api/users/:id - Get user by ID (Admin/Staff only)
 */
router.get('/:id', authenticateToken, authorizeRoles('admin', 'staff'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await UserService.getUserById(id);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
});

/**
 * POST /api/users - Create new user (Admin only)
 */
router.post('/', authenticateToken, authorizeRoles('admin'), validateCreateUser, async (req: Request, res: Response) => {
    try {
        const createUserData: CreateUserRequest = req.body;
        const result = await UserService.createUser(createUserData);

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo người dùng'
        });
    }
});

/**
 * PUT /api/users/:id - Update user (Admin only)
 */
router.put('/:id', authenticateToken, authorizeRoles('admin'), validateUpdateUser, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData: UpdateUserRequest = req.body;
        const result = await UserService.updateUser(id, updateData);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật người dùng'
        });
    }
});

/**
 * PUT /api/users/:id/status - Update user status (Admin/Staff only)
 */
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'staff'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (typeof status !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái phải là boolean'
            });
        }

        const result = await UserService.updateUserStatus(id, status);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật trạng thái người dùng'
        });
    }
});

/**
 * DELETE /api/users/:id - Soft delete user (Admin only)
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await UserService.deleteUser(id);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa người dùng'
        });
    }
});

/**
 * GET /api/users/statistics/overview - Get user statistics (Admin/Staff only)
 */
router.get('/statistics/overview', authenticateToken, authorizeRoles('admin', 'staff'), async (req: Request, res: Response) => {
    try {
        const result = await UserService.getUserStatistics();

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get user statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê người dùng'
        });
    }
});
export default router;