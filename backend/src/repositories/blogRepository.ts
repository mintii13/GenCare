import { Blog, IBlog } from '../models/Blog';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';

export class BlogRepository {
    public static async findAllWithAuthor(): Promise<any[]> {
        try {
            const blogs = await Blog.find({ status: true }) // Chỉ lấy blog đã publish
                .sort({ publish_date: -1 })
                .lean();

            const blogsWithAuthor = await Promise.all(
                blogs.map(async (blog) => {
                    // Tìm user (author)
                    const user = await User.findById(blog.author_id).lean();
                    if (!user) return { ...blog, blog_id: blog._id, author: null };

                    // Tìm consultant info nếu user là consultant
                    let consultantInfo = null;
                    if (user.role === 'consultant') {
                        consultantInfo = await Consultant.findOne({
                            user_id: blog.author_id
                        }).lean();
                    }

                    // Kết hợp thông tin author
                    const author = {
                        consultant_id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        avatar: user.avatar,
                        ...(consultantInfo && {
                            specialization: consultantInfo.specialization,
                            qualifications: consultantInfo.qualifications,
                            experience_years: consultantInfo.experience_years,
                            consultation_rating: consultantInfo.consultation_rating,
                            total_consultations: consultantInfo.total_consultations
                        })
                    };

                    return {
                        ...blog,
                        blog_id: blog._id,
                        author
                    };
                })
            );

            return blogsWithAuthor;
        } catch (error) {
            console.error('Error finding blogs with author:', error);
            throw error;
        }
    }

    public static async findByIdWithAuthor(blogId: string): Promise<any | null> {
        try {
            const blog = await Blog.findOne({ _id: blogId, status: true }).lean(); // Chỉ lấy blog đã publish
            if (!blog) return null;

            // Tìm user (author)
            const user = await User.findById(blog.author_id).lean();
            if (!user) return { ...blog, blog_id: blog._id, author: null };

            // Tìm consultant info nếu user là consultant
            let consultantInfo = null;
            if (user.role === 'consultant') {
                consultantInfo = await Consultant.findOne({
                    user_id: blog.author_id
                }).lean();
            }

            // Kết hợp thông tin author
            const author = {
                consultant_id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                ...(consultantInfo && {
                    specialization: consultantInfo.specialization,
                    qualifications: consultantInfo.qualifications,
                    experience_years: consultantInfo.experience_years,
                    consultation_rating: consultantInfo.consultation_rating,
                    total_consultations: consultantInfo.total_consultations
                })
            };

            return {
                ...blog,
                blog_id: blog._id,
                author
            };
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
}