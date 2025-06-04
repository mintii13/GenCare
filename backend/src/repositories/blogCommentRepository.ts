import { BlogComment, IBlogComment } from '../models/BlogComment';
import { User } from '../models/User';
import { Customer } from '../models/Customer';

export class BlogCommentRepository {
    public static async findByBlogIdWithCustomer(blogId: string): Promise<any[]> {
        try {
            const comments = await BlogComment.find({
                blog_id: blogId,
                status: 'approved'
            })
                .sort({ comment_date: 1 })
                .lean();

            const commentsWithCustomer = await Promise.all(
                comments.map(async (comment) => {
                    // Nếu comment ẩn danh
                    if (comment.is_anonymous || !comment.customer_id) {
                        return {
                            ...comment,
                            comment_id: comment._id,
                            blog_id: comment.blog_id,
                            customer: null
                        };
                    }

                    // Tìm user (customer)
                    const user = await User.findById(comment.customer_id).lean();
                    if (!user) {
                        return {
                            ...comment,
                            comment_id: comment._id,
                            blog_id: comment.blog_id,
                            customer: null
                        };
                    }

                    // Tìm customer info
                    const customerInfo = await Customer.findOne({
                        user_id: comment.customer_id
                    }).lean();

                    // Kết hợp thông tin customer
                    const customer = {
                        customer_id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        avatar: user.avatar,
                        ...(customerInfo && {
                            medical_history: customerInfo.medical_history,
                            custom_avatar: customerInfo.custom_avatar,
                            last_updated: customerInfo.last_updated
                        })
                    };

                    return {
                        ...comment,
                        comment_id: comment._id,
                        blog_id: comment.blog_id,
                        customer
                    };
                })
            );

            return commentsWithCustomer;
        } catch (error) {
            console.error('Error finding comments with customer:', error);
            throw error;
        }
    }
}