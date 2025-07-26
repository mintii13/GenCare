import { Blog, IBlog } from '../models/Blog';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import mongoose from 'mongoose';

export class BlogRepository {
    public static async findAllWithAuthor(): Promise<any[]> {
        try {
            // Use aggregation pipeline to solve N+1 query problem
            const blogsWithAuthor = await Blog.aggregate([
                {
                    $match: { status: true } // Only published blogs
                },
                {
                    $sort: { publish_date: -1 }
                },
                // Join with User collection for author info
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author_id',
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
                // Join with Consultant collection for consultant-specific info
                {
                    $lookup: {
                        from: 'consultants',
                        localField: 'author_id',
                        foreignField: 'user_id',
                        as: 'consultant_info'
                    }
                },
                {
                    $unwind: {
                        path: '$consultant_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Project final result
                {
                    $project: {
                        _id: 1,
                        blog_id: '$_id',
                        title: 1,
                        content: 1,
                        author_id: 1,
                        publish_date: 1,
                        status: 1,
                        read_count: 1,
                        like_count: 1,
                        comment_count: 1,
                        created_at: 1,
                        updated_at: 1,
                        author: {
                            $cond: {
                                if: { $ne: ['$user_info', null] },
                                then: {
                                    consultant_id: '$user_info._id',
                                    full_name: '$user_info.full_name',
                                    email: '$user_info.email',
                                    phone: '$user_info.phone',
                                    role: '$user_info.role',
                                    avatar: '$user_info.avatar',
                                    specialization: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.specialization',
                                            else: null
                                        }
                                    },
                                    qualifications: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.qualifications',
                                            else: null
                                        }
                                    },
                                    experience_years: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.experience_years',
                                            else: null
                                        }
                                    },
                                    consultation_rating: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.consultation_rating',
                                            else: null
                                        }
                                    },
                                    total_consultations: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.total_consultations',
                                            else: null
                                        }
                                    }
                                },
                                else: null
                            }
                        }
                    }
                }
            ]);

            return blogsWithAuthor;
        } catch (error) {
            console.error('Error finding all blogs with author:', error);
            throw error;
        }
    }

    public static async findByIdWithAuthor(blogId: string): Promise<any | null> {
        try {
            // Convert string to ObjectId
            const objectId = new mongoose.Types.ObjectId(blogId);
            
            // Use aggregation pipeline for single blog
            const result = await Blog.aggregate([
                {
                    $match: { 
                        _id: objectId,
                        status: true 
                    }
                },
                // Join with User collection for author info
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author_id',
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
                // Join with Consultant collection for consultant-specific info
                {
                    $lookup: {
                        from: 'consultants',
                        localField: 'author_id',
                        foreignField: 'user_id',
                        as: 'consultant_info'
                    }
                },
                {
                    $unwind: {
                        path: '$consultant_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Project final result
                {
                    $project: {
                        _id: 1,
                        blog_id: '$_id',
                        title: 1,
                        content: 1,
                        author_id: 1,
                        publish_date: 1,
                        status: 1,
                        read_count: 1,
                        like_count: 1,
                        comment_count: 1,
                        created_at: 1,
                        updated_at: 1,
                        author: {
                            $cond: {
                                if: { $ne: ['$user_info', null] },
                                then: {
                                    consultant_id: '$user_info._id',
                                    full_name: '$user_info.full_name',
                                    email: '$user_info.email',
                                    phone: '$user_info.phone',
                                    role: '$user_info.role',
                                    avatar: '$user_info.avatar',
                                    specialization: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.specialization',
                                            else: null
                                        }
                                    },
                                    qualifications: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.qualifications',
                                            else: null
                                        }
                                    },
                                    experience_years: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.experience_years',
                                            else: null
                                        }
                                    },
                                    consultation_rating: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.consultation_rating',
                                            else: null
                                        }
                                    },
                                    total_consultations: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.total_consultations',
                                            else: null
                                        }
                                    }
                                },
                                else: null
                            }
                        }
                    }
                }
            ]);

            return result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('Error finding blog by id with author:', error);
            throw error;
        }
    }

    public static async findById(blogId: string): Promise<IBlog | null> {
        try {
            return await Blog.findOne({ _id: blogId, status: true }).lean(); // Chỉ lấy blog đã publish
        } catch (error) {
            console.error('Error finding blog by id:', error);
            throw error;
        }
    }

    public static async findByIdIncludingDeleted(blogId: string): Promise<IBlog | null> {
        try {
            return await Blog.findById(blogId).lean(); // Lấy cả blog đã bị xóa (cho delete operation)
        } catch (error) {
            console.error('Error finding blog by id including deleted:', error);
            throw error;
        }
    }
    // Updated findWithPagination to use aggregation
    public static async findWithPagination(
        filters: any,
        page: number,
        limit: number,
        sortBy: string = 'publish_date',
        sortOrder: 1 | -1 = -1
    ): Promise<{
        blogs: any[];
        total: number;
    }> {
        try {
            // Build sort object
            const sortObj: any = {};
            sortObj[sortBy] = sortOrder;

            // Use aggregation pipeline for efficient querying
            const pipeline = [
                { $match: filters },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author_id',
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
                {
                    $lookup: {
                        from: 'consultants',
                        localField: 'author_id',
                        foreignField: 'user_id',
                        as: 'consultant_info'
                    }
                },
                {
                    $unwind: {
                        path: '$consultant_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        blog_id: '$_id',
                        title: 1,
                        content: 1,
                        author_id: 1,
                        publish_date: 1,
                        status: 1,
                        read_count: 1,
                        like_count: 1,
                        comment_count: 1,
                        created_at: 1,
                        updated_at: 1,
                        author: {
                            $cond: {
                                if: { $ne: ['$user_info', null] },
                                then: {
                                    consultant_id: '$user_info._id',
                                    full_name: '$user_info.full_name',
                                    email: '$user_info.email',
                                    phone: '$user_info.phone',
                                    role: '$user_info.role',
                                    avatar: '$user_info.avatar',
                                    specialization: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.specialization',
                                            else: null
                                        }
                                    },
                                    qualifications: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.qualifications',
                                            else: null
                                        }
                                    },
                                    experience_years: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.experience_years',
                                            else: null
                                        }
                                    },
                                    consultation_rating: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.consultation_rating',
                                            else: null
                                        }
                                    },
                                    total_consultations: {
                                        $cond: {
                                            if: { $ne: ['$consultant_info', null] },
                                            then: '$consultant_info.total_consultations',
                                            else: null
                                        }
                                    }
                                },
                                else: null
                            }
                        }
                    }
                },
                { $sort: sortObj }
            ];

            // Execute count and data queries in parallel
            const [blogs, totalCountResult] = await Promise.all([
                Blog.aggregate([
                    ...pipeline,
                    { $skip: (page - 1) * limit },
                    { $limit: limit }
                ]),
                Blog.aggregate([
                    { $match: filters },
                    { $count: 'total' }
                ])
            ]);

            const total = totalCountResult.length > 0 ? totalCountResult[0].total : 0;

            return { blogs, total };
        } catch (error) {
            console.error('Error finding blogs with pagination:', error);
            throw error;
        }
    }

    // Other methods remain the same
    public static async create(blogData: Partial<IBlog>): Promise<IBlog> {
        try {
            const blog = new Blog(blogData);
            return await blog.save();
        } catch (error) {
            console.error('Error creating blog:', error);
            throw error;
        }
    }

    public static async update(blogId: string, updateData: Partial<IBlog>): Promise<IBlog | null> {
        try {
            return await Blog.findByIdAndUpdate(
                blogId,
                { ...updateData, updated_at: new Date() },
                { new: true }
            ).lean();
        } catch (error) {
            console.error('Error updating blog:', error);
            throw error;
        }
    }

    public static async delete(blogId: string): Promise<IBlog | null> {
        try {
            return await Blog.findByIdAndDelete(blogId).lean();
        } catch (error) {
            console.error('Error deleting blog:', error);
            throw error;
        }
    }

    public static async incrementReadCount(blogId: string): Promise<void> {
        try {
            await Blog.findByIdAndUpdate(
                blogId,
                { $inc: { read_count: 1 } }
            );
        } catch (error) {
            console.error('Error incrementing read count:', error);
            throw error;
        }
    }
}