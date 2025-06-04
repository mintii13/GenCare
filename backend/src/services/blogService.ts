import { BlogRepository } from '../repositories/blogRepository';
import { BlogCommentRepository } from '../repositories/blogCommentRepository';

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
}