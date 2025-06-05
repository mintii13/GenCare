import { BlogRepository } from '../repositories/blogRepository';
import { BlogCommentRepository } from '../repositories/blogCommentRepository';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';
import { User } from '../models/User';

export class BlogService {
    public static async getAllBlogs() {
        try {
            const blogs = await BlogRepository.findAllWithAuthor();

            return {
                success: true,
                message: 'Lấy danh sách blog thành công',
                data: {
                    blogs
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog service error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi lấy danh sách blog'
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
                    message: 'Không tìm thấy người dùng'
                };
            }

            if (user.role !== 'consultant') {
                return {
                    success: false,
                    message: 'Chỉ tư vấn viên mới được tạo blog'
                };
            }

            const newBlog = await Blog.create({
                author_id: blogData.author_id,
                title: blogData.title.trim(),
                content: blogData.content.trim(),
                status: 'draft', // Mặc định là draft
                publish_date: new Date(),
                updated_date: new Date()
            });

            return {
                success: true,
                message: 'Tạo blog thành công',
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
                message: 'Lỗi hệ thống khi tạo blog'
            };
        }
    }

    public static async getBlogComments(blogId: string) {
        try {
            // Kiểm tra blog có tồn tại
            const blog = await BlogRepository.findById(blogId);
            if (!blog) {
                return {
                    success: false,
                    message: 'Không tìm thấy blog'
                };
            }

            const comments = await BlogCommentRepository.findByBlogIdWithCustomer(blogId);

            return {
                success: true,
                message: 'Lấy danh sách comment thành công',
                data: {
                    comments
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog comment service error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi lấy danh sách comment'
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
            // Kiểm tra blog có tồn tại
            const blog = await BlogRepository.findById(commentData.blog_id);
            if (!blog) {
                return {
                    success: false,
                    message: 'Không tìm thấy blog'
                };
            }

            // Kiểm tra parent comment nếu có
            if (commentData.parent_comment_id) {
                const parentComment = await BlogComment.findById(commentData.parent_comment_id);
                if (!parentComment || parentComment.blog_id.toString() !== commentData.blog_id) {
                    return {
                        success: false,
                        message: 'Parent comment không hợp lệ hoặc không thuộc blog này'
                    };
                }
            }

            // Nếu không anonymous, kiểm tra user có tồn tại
            if (!commentData.is_anonymous && commentData.customer_id) {
                const user = await User.findById(commentData.customer_id);
                if (!user) {
                    return {
                        success: false,
                        message: 'Không tìm thấy người dùng'
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
                status: 'approved' // Mặc định approved, có thể thay đổi logic này
            });

            return {
                success: true,
                message: 'Tạo comment thành công',
                data: {
                    comment: {
                        comment_id: newComment._id,
                        blog_id: newComment.blog_id,
                        customer_id: newComment.customer_id,
                        content: newComment.content,
                        comment_date: newComment.comment_date,
                        parent_comment_id: newComment.parent_comment_id,
                        status: newComment.status,
                        is_anonymous: newComment.is_anonymous
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Create blog comment service error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi tạo comment'
            };
        }
    }

    public static async updateBlog(blogId: string, updateData: {
        author_id: string;
        title: string;
        content: string;
    }) {
        try {
            // Tìm blog
            const blog = await Blog.findById(blogId);
            if (!blog) {
                return {
                    success: false,
                    message: 'Không tìm thấy blog'
                };
            }

            // Kiểm tra quyền chỉnh sửa (chỉ tác giả mới được edit)
            if (blog.author_id.toString() !== updateData.author_id) {
                return {
                    success: false,
                    message: 'Bạn không có quyền chỉnh sửa blog này'
                };
            }

            // Cập nhật blog
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
                message: 'Cập nhật blog thành công',
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
                message: 'Lỗi hệ thống khi cập nhật blog'
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
            // Tìm comment
            const comment = await BlogComment.findById(commentId);
            if (!comment) {
                return {
                    success: false,
                    message: 'Không tìm thấy comment'
                };
            }

            // Kiểm tra comment có thuộc blog này không
            if (comment.blog_id.toString() !== updateData.blog_id) {
                return {
                    success: false,
                    message: 'Comment không thuộc blog này'
                };
            }

            // Kiểm tra quyền chỉnh sửa
            // Nếu comment không ẩn danh, phải là tác giả
            if (!comment.is_anonymous) {
                if (!comment.customer_id || comment.customer_id.toString() !== updateData.customer_id) {
                    return {
                        success: false,
                        message: 'Bạn không có quyền chỉnh sửa comment này'
                    };
                }
            } else {
                // Nếu comment ẩn danh, không cho phép edit (hoặc có thể thay đổi logic này)
                return {
                    success: false,
                    message: 'Không thể chỉnh sửa comment ẩn danh'
                };
            }

            // Cập nhật comment
            const updatedComment = await BlogComment.findByIdAndUpdate(
                commentId,
                {
                    content: updateData.content.trim(),
                    is_anonymous: updateData.is_anonymous || false,
                    // Không cập nhật comment_date để giữ nguyên thời gian tạo
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Cập nhật comment thành công',
                data: {
                    comment: {
                        comment_id: updatedComment._id,
                        blog_id: updatedComment.blog_id,
                        customer_id: updatedComment.customer_id,
                        content: updatedComment.content,
                        comment_date: updatedComment.comment_date,
                        parent_comment_id: updatedComment.parent_comment_id,
                        status: updatedComment.status,
                        is_anonymous: updatedComment.is_anonymous
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update blog comment service error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi cập nhật comment'
            };
        }
    }

    public static async getBlogById(blogId: string) {
        try {
            const blog = await BlogRepository.findByIdWithAuthor(blogId);

            if (!blog) {
                return {
                    success: false,
                    message: 'Không tìm thấy blog'
                };
            }

            return {
                success: true,
                message: 'Lấy chi tiết blog thành công',
                data: {
                    blog
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog service error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi lấy chi tiết blog'
            };
        }
    }
}