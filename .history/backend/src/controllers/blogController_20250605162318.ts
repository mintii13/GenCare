import { Router, Request, Response } from 'express';
import { BlogService } from '../services/blogService';
import mongoose from 'mongoose';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateBlog, validateCreateBlogComment } from '../middlewares/validation';

const router = Router();

// GET /api/blogs - Lấy danh sách tất cả blog
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await BlogService.getAllBlogs();

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get blogs controller error:', error);
        res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

// POST /api/blogs - Tạo blog mới (chỉ Consultant)
router.post('/', authenticateToken, authorizeRoles('consultant'), validateCreateBlog, async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).userId;
        const { title, content } = req.body;

        const result = await BlogService.createBlog({
            author_id: userId,
            title,
            content
        });

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Create blog controller error:', error);
        res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

// GET /api/blogs/:blogId/comments - Lấy comment của blog
router.get('/:blogId/comments', async (req: Request, res: Response) => {
    try {
        const { blogId } = req.params;

        // Kiểm tra ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog ID'
            });
        }

        const result = await BlogService.getBlogComments(blogId);

        if (result.success) {
            res.status(200).json(result);
        } else if (result.message === 'Blog not found') {
            res.status(404).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get blog comments controller error:', error);
        res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

// POST /api/blogs/:blogId/comments - Tạo comment cho blog (cần đăng nhập)
router.post('/:blogId/comments', authenticateToken, validateCreateBlogComment, async (req: Request, res: Response) => {
    try {
        const { blogId } = req.params;
        const userId = (req.user as any).userId;
        const { content, is_anonymous = false, parent_comment_id } = req.body;

        // Kiểm tra ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog ID'
            });
        }

        // Kiểm tra parent_comment_id nếu có
        if (parent_comment_id && !mongoose.Types.ObjectId.isValid(parent_comment_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parent comment ID'
            });
        }

        const result = await BlogService.createBlogComment({
            blog_id: blogId,
            customer_id: is_anonymous ? undefined : userId,
            content,
            is_anonymous,
            parent_comment_id
        });

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Create blog comment controller error:', error);
        res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

// GET /api/blogs/:blogId - Lấy chi tiết blog theo ID
router.get('/:blogId', async (req: Request, res: Response) => {
    try {
        const { blogId } = req.params;

        // Kiểm tra ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog ID'
            });
        }

        const result = await BlogService.getBlogById(blogId);

        if (result.success) {
            res.status(200).json(result);
        } else if (result.message === 'Blog not found') {
            res.status(404).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get blog by id controller error:', error);
        res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

export default router;