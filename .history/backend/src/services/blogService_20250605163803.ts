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
                message: 'Blog list retrieved successfully',
                data: {
                    blogs
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog service error:', error);
            return {
                success: false,
                message: 'System error while retrieving blog list'
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
                status: 'draft', // Mặc định là draft
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
                message: 'System error while creating blog'
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
                    message: 'Blog not found'
                };
            }

            const comments = await BlogCommentRepository.findByBlogIdWithCustomer(blogId);

            return {
                success: true,
                message: 'Comment list retrieved successfully',
                data: {
                    comments
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog comment service error:', error);
            return {
                success: false,
                message: 'System error while retrieving comment list'
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
                    message: 'Blog not found'
                };
            }

            // Kiểm tra parent comment nếu có
            if (commentData.parent_comment_id) {
                const parentComment = await BlogComment.findById(commentData.parent_comment_id);
                if (!parentComment || parentComment.blog_id.toString() !== commentData.blog_id) {
                    return {
                        success: false,
                        message: 'Parent comment is invalid or does not belong to this blog'
                    };
                }
            }

            // Nếu không anonymous, kiểm tra user có tồn tại
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
                status: 'approved' // Mặc định approved, có thể thay đổi logic này
            });

            return {
                success: true,
                message: 'Comment created successfully',
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
                message: 'System error while creating comment'
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
                message: 'Blog details retrieved successfully',
                data: {
                    blog
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Blog service error:', error);
            return {
                success: false,
                message: 'System error while retrieving blog details'
            };
        }
    }
}