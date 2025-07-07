import { BlogRepository } from '../repositories/blogRepository';
import { BlogCommentRepository } from '../repositories/blogCommentRepository';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';
import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { PaginationUtils } from '../utils/paginationUtils';
import { BlogQuery } from '../dto/requests/PaginationRequest';

export class BlogService {
    public static async getAllBlogs() {
        try {
            const blogs = await BlogRepository.findAllWithAuthor();

            return {
                success: true,
                message: 'Get blogs successfully',
                data: {
                    blogs
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog service error:', error);
            return {
                success: false,
                message: 'Internal server error when getting blogs'
            };
        }
    }

    public static async createBlog(blogData: {
        author_id: string;
        title: string;
        content: string;
    }) {
        try {
            // Kiểm tra user có tồn tại và có role consultant không
            const user = await User.findById(blogData.author_id);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            if (user.role !== 'consultant') {
                return {
                    success: false,
                    message: 'Only consultants can create blogs'
                };
            }

            const newBlog = await Blog.create({
                author_id: blogData.author_id,
                title: blogData.title.trim(),
                content: blogData.content.trim(),
                status: true, // Auto publish khi consultant tạo blog
                publish_date: new Date(),
                updated_date: new Date()
            });

            return {
                success: true,
                message: 'Blog created successfully',
                data: {
                    blog: {
                        blog_id: newBlog._id,
                        title: newBlog.title,
                        content: newBlog.content,
                        status: newBlog.status,
                        publish_date: newBlog.publish_date,
                        updated_date: newBlog.updated_date,
                        author_id: newBlog.author_id
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Create blog service error:', error);
            return {
                success: false,
                message: 'Internal server error when creating blog'
            };
        }
    }

    public static async updateBlog(blogId: string, updateData: {
        author_id: string;
        title: string;
        content: string;
    }) {
        try {
            const blog = await BlogRepository.findByIdIncludingDeleted(blogId);
            if (!blog) {
                return {
                    success: false,
                    message: 'Blog not found'
                };
            }

            if (!blog.status) {
                return {
                    success: false,
                    message: 'Cannot update deleted blog'
                };
            }

            if (blog.author_id.toString() !== updateData.author_id) {
                return {
                    success: false,
                    message: 'You do not have permission to edit this blog'
                };
            }

            const updatedBlog = await Blog.findByIdAndUpdate(
                blogId,
                {
                    title: updateData.title.trim(),
                    content: updateData.content.trim(),
                    updated_date: new Date()
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Blog updated successfully',
                data: {
                    blog: {
                        blog_id: updatedBlog._id,
                        title: updatedBlog.title,
                        content: updatedBlog.content,
                        status: updatedBlog.status,
                        publish_date: updatedBlog.publish_date,
                        updated_date: updatedBlog.updated_date,
                        author_id: updatedBlog.author_id
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update blog service error:', error);
            return {
                success: false,
                message: 'Internal server error when updating blog'
            };
        }
    }

    public static async deleteBlog(blogId: string, requestUserId: string, requestUserRole: string) {
        try {
            const blog = await BlogRepository.findByIdIncludingDeleted(blogId);
            if (!blog) {
                return {
                    success: false,
                    message: 'Blog not found'
                };
            }

            if (!blog.status) {
                return {
                    success: false,
                    message: 'Blog already deleted'
                };
            }

            // Kiểm tra quyền: chỉ author hoặc staff mới được xóa
            const isAuthor = blog.author_id.toString() === requestUserId;
            const isStaff = requestUserRole === 'staff' || requestUserRole === 'admin';

            if (!isAuthor && !isStaff) {
                return {
                    success: false,
                    message: 'You do not have permission to delete this blog'
                };
            }

            // Soft delete blog
            await Blog.findByIdAndUpdate(blogId, { status: false });

            // Soft delete tất cả comments của blog này
            await BlogComment.updateMany(
                { blog_id: blogId },
                { status: false }
            );

            return {
                success: true,
                message: 'Blog deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete blog service error:', error);
            return {
                success: false,
                message: 'Internal server error when deleting blog'
            };
        }
    }

    public static async getBlogComments(blogId: string) {
        try {
            const blog = await BlogRepository.findById(blogId);
            if (!blog) {
                return {
                    success: false,
                    message: 'Blog not found'
                };
            }

            const comments = await BlogCommentRepository.findByBlogIdWithCustomer(blogId);

            return {
                success: true,
                message: 'Get comments successfully',
                data: {
                    comments
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog comment service error:', error);
            return {
                success: false,
                message: 'Internal server error when getting comments'
            };
        }
    }

    public static async createBlogComment(commentData: {
        blog_id: string;
        customer_id?: string;
        content: string;
        is_anonymous?: boolean;
        parent_comment_id?: string;
    }) {
        try {
            const blog = await BlogRepository.findById(commentData.blog_id);
            if (!blog) {
                return {
                    success: false,
                    message: 'Blog not found'
                };
            }

            if (commentData.parent_comment_id) {
                const parentComment = await BlogComment.findOne({
                    _id: commentData.parent_comment_id,
                    status: true
                });
                if (!parentComment || parentComment.blog_id.toString() !== commentData.blog_id) {
                    return {
                        success: false,
                        message: 'Invalid parent comment or parent comment does not belong to this blog'
                    };
                }
            }

            if (!commentData.is_anonymous && commentData.customer_id) {
                const user = await User.findById(commentData.customer_id);
                if (!user) {
                    return {
                        success: false,
                        message: 'User not found'
                    };
                }
            }

            const newComment = await BlogComment.create({
                blog_id: commentData.blog_id,
                customer_id: commentData.is_anonymous ? undefined : commentData.customer_id,
                content: commentData.content.trim(),
                is_anonymous: commentData.is_anonymous || false,
                parent_comment_id: commentData.parent_comment_id || undefined,
                comment_date: new Date(),
                status: true // Auto approve comment
            });

            const responseComment: any = {
                comment_id: newComment._id,
                blog_id: newComment.blog_id,
                content: newComment.content,
                comment_date: newComment.comment_date,
                parent_comment_id: newComment.parent_comment_id,
                status: newComment.status,
                is_anonymous: newComment.is_anonymous
            };

            if (!newComment.is_anonymous && newComment.customer_id) {
                const user = await User.findById(newComment.customer_id).lean();
                if (user) {
                    responseComment.user = {
                        user_id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        avatar: user.avatar
                    };
                } else {
                    responseComment.user = null;
                }
            } else {
                responseComment.user = null;
            }

            return {
                success: true,
                message: 'Comment created successfully',
                data: {
                    comment: responseComment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Create blog comment service error:', error);
            return {
                success: false,
                message: 'Internal server error when creating comment'
            };
        }
    }

    public static async updateBlogComment(commentId: string, updateData: {
        blog_id: string;
        customer_id: string;
        content: string;
        is_anonymous?: boolean;
    }) {
        try {
            const comment = await BlogComment.findOne({ _id: commentId, status: true });
            if (!comment) {
                return {
                    success: false,
                    message: 'Comment not found'
                };
            }

            if (comment.blog_id.toString() !== updateData.blog_id) {
                return {
                    success: false,
                    message: 'Comment does not belong to this blog'
                };
            }

            if (!comment.is_anonymous) {
                if (!comment.customer_id || comment.customer_id.toString() !== updateData.customer_id) {
                    return {
                        success: false,
                        message: 'You do not have permission to edit this comment'
                    };
                }
            } else {
                return {
                    success: false,
                    message: 'Cannot edit anonymous comment'
                };
            }

            const updatedComment = await BlogComment.findByIdAndUpdate(
                commentId,
                {
                    content: updateData.content.trim(),
                    is_anonymous: updateData.is_anonymous || false,
                },
                { new: true }
            );

            const responseComment: any = {
                comment_id: updatedComment._id,
                blog_id: updatedComment.blog_id,
                content: updatedComment.content,
                comment_date: updatedComment.comment_date,
                parent_comment_id: updatedComment.parent_comment_id,
                status: updatedComment.status,
                is_anonymous: updatedComment.is_anonymous
            };

            if (!updatedComment.is_anonymous && updatedComment.customer_id) {
                const user = await User.findById(updatedComment.customer_id).lean();
                if (user) {
                    responseComment.user = {
                        user_id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        avatar: user.avatar
                    };
                } else {
                    responseComment.user = null;
                }
            } else {
                responseComment.user = null;
            }

            return {
                success: true,
                message: 'Comment updated successfully',
                data: {
                    comment: responseComment
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update blog comment service error:', error);
            return {
                success: false,
                message: 'Internal server error when updating comment'
            };
        }
    }

    public static async deleteBlogComment(commentId: string, requestUserId: string, requestUserRole: string) {
        try {
            const comment = await BlogCommentRepository.findByIdIncludingDeleted(commentId);
            if (!comment) {
                return {
                    success: false,
                    message: 'Comment not found'
                };
            }

            if (!comment.status) {
                return {
                    success: false,
                    message: 'Comment already deleted'
                };
            }

            // Kiểm tra quyền xóa comment:
            // 1. Người viết comment (nếu không phải anonymous)
            // 2. Author của blog
            // 3. Staff/Admin
            const isCommentAuthor = !comment.is_anonymous &&
                comment.customer_id &&
                comment.customer_id.toString() === requestUserId;

            // Kiểm tra xem user có phải là author của blog không
            const blog = await BlogRepository.findByIdIncludingDeleted(comment.blog_id.toString());
            const isBlogAuthor = blog && blog.author_id.toString() === requestUserId;

            const isStaffOrAdmin = requestUserRole === 'staff' || requestUserRole === 'admin';

            if (!isCommentAuthor && !isBlogAuthor && !isStaffOrAdmin) {
                return {
                    success: false,
                    message: 'You do not have permission to delete this comment'
                };
            }

            // Soft delete comment
            await BlogComment.findByIdAndUpdate(commentId, { status: false });

            // Soft delete tất cả reply comments
            await BlogComment.updateMany(
                { parent_comment_id: commentId },
                { status: false }
            );

            return {
                success: true,
                message: 'Comment deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete blog comment service error:', error);
            return {
                success: false,
                message: 'Internal server error when deleting comment'
            };
        }
    }

    public static async getBlogById(blogId: string) {
        try {
            const blog = await BlogRepository.findByIdWithAuthor(blogId);

            if (!blog) {
                return {
                    success: false,
                    message: 'Blog not found'
                };
            }

            return {
                success: true,
                message: 'Get blog successfully',
                data: {
                    blog
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog service error:', error);
            return {
                success: false,
                message: 'Internal server error when getting blog'
            };
        }
    }

    public static async getCommentById(commentId: string) {
        try {
            return await BlogComment.findById(commentId).lean();
        } catch (error) {
            console.error('Error finding comment by id:', error);
            return null;
        }
    }

    public static async getBlogsWithPagination(query: BlogQuery) {
        try {
            // Validate và normalize pagination parameters
            const { page, limit, sort_by, sort_order } = PaginationUtils.validatePagination(query);

            // Build filter query
            const filters = PaginationUtils.buildBlogFilter(query);

            // Sanitize search nếu có
            if (query.search) {
                query.search = PaginationUtils.sanitizeSearch(query.search);
            }

            // Get data từ repository
            const result = await BlogRepository.findWithPagination(
                filters,
                page,
                limit,
                sort_by,
                sort_order
            );

            // Calculate pagination info
            const pagination = PaginationUtils.calculatePagination(
                result.total,
                page,
                limit
            );

            // Build filters_applied object để track các filter đã dùng
            const filters_applied: any = {};
            if (query.search) filters_applied.search = query.search;
            if (query.author_id) filters_applied.author_id = query.author_id;
            if (query.status !== undefined) filters_applied.status = query.status;
            if (query.date_from) filters_applied.date_from = query.date_from;
            if (query.date_to) filters_applied.date_to = query.date_to;
            if (query.sort_by) filters_applied.sort_by = query.sort_by;
            if (query.sort_order) filters_applied.sort_order = query.sort_order;

            return {
                success: true,
                message: result.blogs.length > 0
                    ? 'Blogs retrieved successfully'
                    : 'No blogs found matching the criteria',
                data: {
                    blogs: result.blogs,
                    pagination,
                    filters_applied
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog service pagination error:', error);
            return {
                success: false,
                message: 'Internal server error when getting blogs'
            };
        }
    }

    /**
     * THÊM METHOD MỚI: Get blogs count by author (useful cho stats)
     */
    public static async getBlogCountByAuthor(authorId: string) {
        try {
            const published = await Blog.countDocuments({
                author_id: authorId,
                status: true
            });

            const draft = await Blog.countDocuments({
                author_id: authorId,
                status: false
            });

            return {
                success: true,
                data: {
                    published,
                    draft,
                    total: published + draft
                }
            };
        } catch (error) {
            console.error('Get blog count by author error:', error);
            return {
                success: false,
                message: 'Internal server error'
            };
        }
    }
}