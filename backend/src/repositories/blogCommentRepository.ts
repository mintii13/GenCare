import { BlogComment, IBlogComment } from '../models/BlogComment';
import { User } from '../models/User';
import mongoose from 'mongoose';

export class BlogCommentRepository {
    public static async findByBlogIdWithCustomer(blogId: string): Promise<any[]> {
        try {
            console.log('=== DEBUG BLOG COMMENTS ===');
            console.log('Looking for comments with blog_id:', blogId);

            // Convert string to ObjectId if needed  
            const objectId = mongoose.Types.ObjectId.isValid(blogId) 
                ? new mongoose.Types.ObjectId(blogId) 
                : blogId;

            // Use aggregation to solve N+1 query problem
            const commentsWithUser = await BlogComment.aggregate([
                {
                    $match: {
                        blog_id: objectId,
                status: true
                    }
                },
                {
                    $sort: { comment_date: 1 }
                },
                // Left join with User collection to get user info
                {
                    $lookup: {
                        from: 'users',
                        localField: 'customer_id',
                        foreignField: '_id',
                        as: 'user_info'
                    }
                },
                // Unwind user_info but preserve comments without user (for anonymous or deleted users)
                {
                    $unwind: {
                        path: '$user_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Project the final result
                {
                    $project: {
                        _id: 1,
                        blog_id: 1,
                        user_id: '$customer_id',
                        content: 1,
                        comment_date: 1,
                        parent_comment_id: 1,
                        status: 1,
                        is_anonymous: 1,
                        __v: 1,
                        comment_id: '$_id',
                        user: {
                            $cond: {
                                if: { 
                                    $and: [
                                        { $ne: ['$is_anonymous', true] },
                                        { $ne: ['$user_info', null] },
                                        { $ne: ['$customer_id', null] }
                                    ]
                                },
                                then: {
                                    user_id: '$user_info._id',
                                    full_name: '$user_info.full_name',
                                    email: '$user_info.email',
                                    phone: '$user_info.phone',
                                    role: '$user_info.role',
                                    avatar: '$user_info.avatar'
                                },
                                else: null
                            }
                        }
                    }
                }
            ]);

            console.log('Final result with user info:', commentsWithUser.length);
            console.log('=== END DEBUG ===');

            return commentsWithUser;
        } catch (error) {
            console.error('Error finding comments by blog ID with customer:', error);
            throw error;
        }
    }

    /**
     * UPDATED METHOD: Find comments với pagination và filtering using aggregation
 */
    public static async findWithPagination(
        filters: any,
        page: number,
        limit: number,
        sortBy: string = 'comment_date',
        sortOrder: 1 | -1 = -1
    ): Promise<{
        comments: any[];
        total: number;
    }> {
        try {
            // Build sort object
            const sortObj: any = {};
            sortObj[sortBy] = sortOrder;

            // Use aggregation pipeline to solve N+1 query problem
            const pipeline = [
                { $match: filters },
                // Left join with User collection to get user info
                {
                    $lookup: {
                        from: 'users',
                        localField: 'customer_id',
                        foreignField: '_id',
                        as: 'user_info'
                    }
                },
                // Unwind user_info but preserve comments without user
                {
                    $unwind: {
                        path: '$user_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Project the final result
                {
                    $project: {
                        _id: 1,
                        blog_id: 1,
                        user_id: '$customer_id',
                        content: 1,
                        comment_date: 1,
                        parent_comment_id: 1,
                        status: 1,
                        is_anonymous: 1,
                        comment_id: '$_id',
                        user: {
                            $cond: {
                                if: { 
                                    $and: [
                                        { $ne: ['$is_anonymous', true] },
                                        { $ne: ['$user_info', null] },
                                        { $ne: ['$customer_id', null] }
                                    ]
                                },
                                then: {
                                    user_id: '$user_info._id',
                                    full_name: '$user_info.full_name',
                                    email: '$user_info.email',
                                    phone: '$user_info.phone',
                                    role: '$user_info.role',
                                    avatar: '$user_info.avatar'
                                },
                                else: null
                            }
                        }
                    }
                },
                { $sort: sortObj }
            ];

            // Execute count and data queries in parallel
            const [comments, totalCountResult] = await Promise.all([
                BlogComment.aggregate([
                    ...pipeline,
                    { $skip: (page - 1) * limit },
                    { $limit: limit }
                ]),
                BlogComment.aggregate([
                    { $match: filters },
                    { $count: 'total' }
                ])
            ]);

            const total = totalCountResult.length > 0 ? totalCountResult[0].total : 0;

            return { comments, total };
        } catch (error) {
            console.error('Error finding comments with pagination:', error);
            throw error;
        }
    }

    // Other CRUD methods remain the same but optimized
    public static async create(commentData: Partial<IBlogComment>): Promise<IBlogComment> {
        try {
            const comment = new BlogComment(commentData);
            return await comment.save();
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    }

    public static async findById(commentId: string): Promise<IBlogComment | null> {
        try {
            return await BlogComment.findById(commentId).lean();
        } catch (error) {
            console.error('Error finding comment by ID:', error);
            throw error;
        }
    }

    public static async update(commentId: string, updateData: Partial<IBlogComment>): Promise<IBlogComment | null> {
        try {
            return await BlogComment.findByIdAndUpdate(
                commentId,
                updateData,
                { new: true }
            ).lean();
        } catch (error) {
            console.error('Error updating comment:', error);
            throw error;
        }
    }

    public static async delete(commentId: string): Promise<IBlogComment | null> {
        try {
            return await BlogComment.findByIdAndDelete(commentId).lean();
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    }

    public static async findByBlogId(blogId: string): Promise<IBlogComment[]> {
        try {
            return await BlogComment.find({ 
                blog_id: blogId,
                status: true 
            })
            .sort({ comment_date: 1 })
            .lean();
        } catch (error) {
            console.error('Error finding comments by blog ID:', error);
            throw error;
        }
    }

    public static async findByCustomerId(customerId: string): Promise<IBlogComment[]> {
        try {
            return await BlogComment.find({ 
                customer_id: customerId,
                status: true 
            })
            .sort({ comment_date: -1 })
            .lean();
        } catch (error) {
            console.error('Error finding comments by customer ID:', error);
            throw error;
        }
    }

    // Efficient method to get comment counts for multiple blogs
    public static async getCommentCountsByBlogIds(blogIds: string[]): Promise<Record<string, number>> {
        try {
            const objectIds = blogIds.map(id => 
                mongoose.Types.ObjectId.isValid(id) 
                    ? new mongoose.Types.ObjectId(id) 
                    : id
            );

            const counts = await BlogComment.aggregate([
                {
                    $match: {
                        blog_id: { $in: objectIds },
                        status: true
                    }
                },
                {
                    $group: {
                        _id: '$blog_id',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const result: Record<string, number> = {};
            counts.forEach(item => {
                result[item._id.toString()] = item.count;
            });

            return result;
        } catch (error) {
            console.error('Error getting comment counts by blog IDs:', error);
            throw error;
        }
    }

    // Method to get latest comments for dashboard/overview
    public static async getLatestComments(limit: number = 10): Promise<any[]> {
        try {
            return await BlogComment.aggregate([
                {
                    $match: { status: true }
                },
                {
                    $sort: { comment_date: -1 }
                },
                {
                    $limit: limit
                },
                // Join with User for commenter info
                {
                    $lookup: {
                        from: 'users',
                        localField: 'customer_id',
                        foreignField: '_id',
                        as: 'user_info'
                    }
                },
                {
                    $unwind: {
                        path: '$user_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Join with Blog for blog info
                {
                    $lookup: {
                        from: 'blogs',
                        localField: 'blog_id',
                        foreignField: '_id',
                        as: 'blog_info'
                    }
                },
                {
                    $unwind: {
                        path: '$blog_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        comment_date: 1,
                        is_anonymous: 1,
                        user: {
                            $cond: {
                                if: { 
                                    $and: [
                                        { $ne: ['$is_anonymous', true] },
                                        { $ne: ['$user_info', null] }
                                    ]
                                },
                                then: {
                                    user_id: '$user_info._id',
                                    full_name: '$user_info.full_name',
                                    avatar: '$user_info.avatar'
                                },
                                else: null
                            }
                        },
                        blog: {
                            $cond: {
                                if: { $ne: ['$blog_info', null] },
                                then: {
                                    blog_id: '$blog_info._id',
                                    title: '$blog_info.title'
                                },
                                else: null
                            }
                        }
                    }
                }
            ]);
        } catch (error) {
            console.error('Error getting latest comments:', error);
            throw error;
        }
    }
}