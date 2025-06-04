import { Router, Request, Response } from 'express';
import { BlogService } from '../services/blogService';
import mongoose from 'mongoose';

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
            message: 'Lỗi hệ thống'
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
                message: 'Blog ID không hợp lệ'
            });
        }

        const result = await BlogService.getBlogComments(blogId);

        if (result.success) {
            res.status(200).json(result);
        } else if (result.message === 'Không tìm thấy blog') {
            res.status(404).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get blog comments controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
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
                message: 'Blog ID không hợp lệ'
            });
        }

        const result = await BlogService.getBlogById(blogId);

        if (result.success) {
            res.status(200).json(result);
        } else if (result.message === 'Không tìm thấy blog') {
            res.status(404).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get blog by id controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

export default router;