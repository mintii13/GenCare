import { BlogComment, IBlogComment } from '../models/BlogComment';
import { User } from '../models/User';

export class BlogCommentRepository {
    public static async findByBlogIdWithCustomer(blogId: string): Promise<any[]> {
        try {
            console.log('=== DEBUG BLOG COMMENTS ===');
            console.log('Looking for comments with blog_id:', blogId);

            // Debug: Kiểm tra tất cả comments trong database
            const allComments = await BlogComment.find({}).lean();
            console.log('Total comments in database:', allComments.length);
            console.log('All comments:', allComments.map(c => ({
                id: c._id,
                blog_id: c.blog_id,
                status: c.status,
                content: c.content.substring(0, 50) + '...'
            })));

            // Debug: Kiểm tra comments theo blog_id (không filter status)
            const commentsForBlog = await BlogComment.find({ blog_id: blogId }).lean();
            console.log('Comments for this blog (all status):', commentsForBlog.length);
            console.log('Comments for blog:', commentsForBlog.map(c => ({
                id: c._id,
                status: c.status,
                content: c.content.substring(0, 50) + '...'
            })));

            // Debug: Kiểm tra comments với status = true
            const activeCommentsForBlog = await BlogComment.find({
                blog_id: blogId,
                status: true
            }).lean();
            console.log('Active comments for this blog:', activeCommentsForBlog.length);

            const comments = await BlogComment.find({
                blog_id: blogId,
                status: true
            })
                .sort({ comment_date: 1 })
                .lean();

            console.log('Final comments after sort:', comments.length);

            const commentsWithUser = await Promise.all(
                comments.map(async (comment) => {
                    // Nếu comment ẩn danh, không trả về user info và user_id
                    if (comment.is_anonymous) {
                        return {
                            _id: comment._id,
                            blog_id: comment.blog_id,
                            user_id: comment.customer_id,
                            content: comment.content,
                            comment_date: comment.comment_date,
                            parent_comment_id: comment.parent_comment_id,
                            status: comment.status,
                            is_anonymous: comment.is_anonymous,
                            __v: comment.__v,
                            comment_id: comment._id,
                            user: null
                        };
                    }

                    // Nếu comment không ẩn danh nhưng không có customer_id
                    if (!comment.customer_id) {
                        return {
                            _id: comment._id,
                            blog_id: comment.blog_id,
                            user_id: comment.customer_id,
                            content: comment.content,
                            comment_date: comment.comment_date,
                            parent_comment_id: comment.parent_comment_id,
                            status: comment.status,
                            is_anonymous: comment.is_anonymous,
                            __v: comment.__v,
                            comment_id: comment._id,
                            user: null
                        };
                    }

                    // Tìm user
                    const user = await User.findById(comment.customer_id).lean();
                    if (!user) {
                        console.log('User not found for customer_id:', comment.customer_id);
                        return {
                            _id: comment._id,
                            blog_id: comment.blog_id,
                            user_id: comment.customer_id,
                            content: comment.content,
                            comment_date: comment.comment_date,
                            parent_comment_id: comment.parent_comment_id,
                            status: comment.status,
                            is_anonymous: comment.is_anonymous,
                            __v: comment.__v,
                            comment_id: comment._id,
                            user: null
                        };
                    }

                    // Trả về thông tin user
                    const userInfo = {
                        user_id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        avatar: user.avatar
                    };

                    return {
                        _id: comment._id,
                        blog_id: comment.blog_id,
                        user_id: comment.customer_id,
                        content: comment.content,
                        comment_date: comment.comment_date,
                        parent_comment_id: comment.parent_comment_id,
                        status: comment.status,
                        is_anonymous: comment.is_anonymous,
                        __v: comment.__v,
                        comment_id: comment._id,
                        user: userInfo
                    };
                })
            );

            console.log('Final result with user info:', commentsWithUser.length);
            console.log('=== END DEBUG ===');

            return commentsWithUser;
        } catch (error) {
            console.error('Error finding comments with user:', error);
            throw error;
        }
    }

    public static async findByIdIncludingDeleted(commentId: string): Promise<IBlogComment | null> {
        try {
            return await BlogComment.findById(commentId).lean();
        } catch (error) {
            console.error('Error finding comment by id including deleted:', error);
            throw error;
        }
    }
}