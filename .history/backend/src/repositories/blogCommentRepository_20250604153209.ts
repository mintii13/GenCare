import { BlogComment, IBlogComment } from '../models/BlogComment';
import { User } from '../models/User';
import { Customer } from '../models/Customer';

export class BlogCommentRepository {
    public static async findByBlogIdWithCustomer(blogId: number): Promise<any[]> {
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
                        return { ...comment, customer: null };
                    }

                    // Tìm user theo _id (customer_id phải là ObjectId)
                    const user = await User.findById(comment.customer_id).lean();
                    if (!user) return { ...comment, customer: null };

                    // Tìm customer info
                    const customerInfo = await Customer.findOne({
                        user_id: user._id.toString()
                    }).lean();

                    // Kết hợp thông tin customer
                    const customer = {
                        user_id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        avatar: user.avatar, // Lấy avatar từ User
                        ...(customerInfo && {
                            medical_history: customerInfo.medical_history,
                            last_updated: customerInfo.last_updated
                        })
                    };

                    return { ...comment, customer };
                })
            );

            return commentsWithCustomer;
        } catch (error) {
            console.error('Error finding comments with customer:', error);
            throw error;
        }
    }
}