import { Router, Request, Response } from 'express';
import { BlogService } from '../services/blogService';
import mongoose from 'mongoose';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { validateCreateBlog, validateCreateBlogComment } from '../middlewares/validation';
import { BlogQuery } from '../dto/requests/PaginationRequest';
import { validatePaginationQuery, validateBlogQuery } from '../middlewares/paginationValidation';

const router = Router();

/**
 * ROUTE MỚI: GET /api/blogs/paginated - Lấy blogs với pagination
 * Đây sẽ là main route thay thế cho route cũ
 */
router.get('/',
    validatePaginationQuery,
    validateBlogQuery,
    async (req: Request, res: Response) => {
        try {
            const query: BlogQuery = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10,
                search: req.query.search as string,
                author_id: req.query.author_id as string,
                status: req.query.status === 'true' ? true : req.query.status === 'false' ? false : undefined,
                date_from: req.query.date_from as string,
                date_to: req.query.date_to as string,
                sort_by: req.query.sort_by as any || 'publish_date',
                sort_order: req.query.sort_order as any || 'desc'
            };

            console.log('Blog pagination query:', query);

            const result = await BlogService.getBlogsWithPagination(query);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Get blogs with pagination controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * ROUTE MỚI: GET /api/blogs/search - Search blogs
 */
router.get('/search',
    validatePaginationQuery,
    validateBlogQuery,
    async (req: Request, res: Response) => {
        try {
            if (!req.query.search) {
                return res.status(400).json({
                    success: false,
                    message: 'Search parameter is required'
                });
            }

            const query: BlogQuery = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10,
                search: req.query.search as string,
                author_id: req.query.author_id as string,
                date_from: req.query.date_from as string,
                date_to: req.query.date_to as string,
                sort_by: req.query.sort_by as any || 'publish_date',
                sort_order: req.query.sort_order as any || 'desc'
            };

            const result = await BlogService.getBlogsWithPagination(query);
            res.status(200).json(result);
        } catch (error) {
            console.error('Search blogs controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);


/**
 * ROUTE MỚI: GET /api/blogs/author/:authorId/stats - Get blog stats của author
 */
router.get('/author/:authorId/stats', async (req: Request, res: Response) => {
    try {
        const { authorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(authorId)) {
            return res.status(400).json({
                success: false,
                message: 'Author ID không hợp lệ'
            });
        }

        const result = await BlogService.getBlogCountByAuthor(authorId);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get blog stats controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
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
        } else if (result.message === 'Blog not found') {
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
                message: 'Blog ID không hợp lệ'
            });
        }

        // Kiểm tra parent_comment_id nếu có
        if (parent_comment_id && !mongoose.Types.ObjectId.isValid(parent_comment_id)) {
            return res.status(400).json({
                success: false,
                message: 'Parent comment ID không hợp lệ'
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
            message: 'Lỗi hệ thống'
        });
    }
});

// PUT /api/blogs/:blogId - Chỉnh sửa blog (chỉ tác giả)
router.put('/:blogId', authenticateToken, validateCreateBlog, async (req: Request, res: Response) => {
    try {
        const { blogId } = req.params;
        const userId = (req as any).user.userId;
        const { title, content } = req.body;

        // Kiểm tra ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                success: false,
                message: 'Blog ID không hợp lệ'
            });
        }

        const result = await BlogService.updateBlog(blogId, {
            author_id: userId,
            title,
            content
        });

        if (result.success) {
            res.status(200).json(result);
        } else if (result.message === 'Blog not found') {
            res.status(404).json(result);
        } else if (result.message === 'You do not have permission to edit this blog' ||
            result.message === 'Cannot update deleted blog') {
            res.status(403).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Update blog controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// DELETE /api/blogs/:blogId - Xóa blog (author hoặc staff hoặc admin)
router.delete('/:blogId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { blogId } = req.params;
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        // Kiểm tra ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                success: false,
                message: 'Blog ID không hợp lệ'
            });
        }

        const result = await BlogService.deleteBlog(blogId, userId, userRole);

        if (result.success) {
            res.status(200).json(result);
        } else if (result.message === 'Blog not found') {
            res.status(404).json(result);
        } else if (result.message === 'You do not have permission to delete this blog' ||
            result.message === 'Blog already deleted') {
            res.status(403).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Delete blog controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// PUT /api/blogs/:blogId/comments/:commentId - Chỉnh sửa comment (chỉ user là chủ comment)
router.put('/:blogId/comments/:commentId', authenticateToken, validateCreateBlogComment, async (req: Request, res: Response) => {
    try {
        const { blogId, commentId } = req.params;
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const { content, is_anonymous = false } = req.body;

        // Kiểm tra ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                success: false,
                message: 'Blog ID không hợp lệ'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({
                success: false,
                message: 'Comment ID không hợp lệ'
            });
        }

        // Chỉ cho phép chủ comment (không phân biệt role) được sửa bình luận của mình
        const comment = await BlogService.getCommentById(commentId);
        if (!comment || !comment.customer_id || comment.customer_id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể sửa bình luận của chính mình'
            });
        }

        const result = await BlogService.updateBlogComment(commentId, {
            blog_id: blogId,
            customer_id: userId,
            content,
            is_anonymous
        });

        if (result.success) {
            res.status(200).json(result);
        } else if (result.message === 'Comment not found') {
            res.status(404).json(result);
        } else if (result.message === 'You do not have permission to edit this comment' ||
            result.message === 'Cannot edit anonymous comment') {
            res.status(403).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Update blog comment controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// DELETE /api/blogs/:blogId/comments/:commentId - Xóa comment (tác giả comment, tác giả blog, staff, consultant hoặc admin)
router.delete('/:blogId/comments/:commentId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { blogId, commentId } = req.params;
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        // Kiểm tra ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({
                success: false,
                message: 'Blog ID không hợp lệ'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({
                success: false,
                message: 'Comment ID không hợp lệ'
            });
        }

        const result = await BlogService.deleteBlogComment(commentId, userId, userRole);

        if (result.success) {
            res.status(200).json(result);
        } else if (result.message === 'Comment not found') {
            res.status(404).json(result);
        } else if (result.message === 'You do not have permission to delete this comment' ||
            result.message === 'Comment already deleted') {
            res.status(403).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Delete blog comment controller error:', error);
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
        } else if (result.message === 'Blog not found') {
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