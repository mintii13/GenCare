// Thêm debug vào blogCommentRepository.ts
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

            const commentsWithCustomer = await Promise.all(
                comments.map(async (comment) => {
                    // Nếu comment ẩn danh, không trả về customer info và customer_id
                    if (comment.is_anonymous) {
                        return {
                            _id: comment._id,
                            blog_id: comment.blog_id,
                            content: comment.content,
                            comment_date: comment.comment_date,
                            parent_comment_id: comment.parent_comment_id,
                            status: comment.status,
                            is_anonymous: comment.is_anonymous,
                            __v: comment.__v,
                            comment_id: comment._id,
                            customer: null
                        };
                    }

                    // Nếu comment không ẩn danh nhưng không có customer_id
                    if (!comment.customer_id) {
                        return {
                            _id: comment._id,
                            blog_id: comment.blog_id,
                            content: comment.content,
                            comment_date: comment.comment_date,
                            parent_comment_id: comment.parent_comment_id,
                            status: comment.status,
                            is_anonymous: comment.is_anonymous,
                            __v: comment.__v,
                            comment_id: comment._id,
                            customer: null
                        };
                    }

                    // Tìm user (customer)
                    const user = await User.findById(comment.customer_id).lean();
                    if (!user) {
                        console.log('User not found for customer_id:', comment.customer_id);
                        return {
                            _id: comment._id,
                            blog_id: comment.blog_id,
                            content: comment.content,
                            comment_date: comment.comment_date,
                            parent_comment_id: comment.parent_comment_id,
                            status: comment.status,
                            is_anonymous: comment.is_anonymous,
                            __v: comment.__v,
                            comment_id: comment._id,
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
                        _id: comment._id,
                        blog_id: comment.blog_id,
                        content: comment.content,
                        comment_date: comment.comment_date,
                        parent_comment_id: comment.parent_comment_id,
                        status: comment.status,
                        is_anonymous: comment.is_anonymous,
                        __v: comment.__v,
                        comment_id: comment._id,
                        customer
                    };
                })
            );

            console.log('Final result with customer info:', commentsWithCustomer.length);
            console.log('=== END DEBUG ===');

            return commentsWithCustomer;
        } catch (error) {
            console.error('Error finding comments with customer:', error);
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