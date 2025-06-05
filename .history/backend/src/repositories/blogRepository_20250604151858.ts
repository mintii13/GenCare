import { Blog, IBlog } from '../models/Blog';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';

export class BlogRepository {
    public static async findAllWithAuthor(): Promise<any[]> {
        try {
            const blogs = await Blog.find({ status: 'published' })
                .sort({ publish_date: -1 })
                .lean();

            const blogsWithAuthor = await Promise.all(
                blogs.map(async (blog) => {
                    // Tìm user theo author_id
                    const user = await User.findOne({ user_id: blog.author_id }).lean();
                    if (!user) return { ...blog, author: null };

                    // Tìm consultant info nếu user là consultant
                    let consultantInfo = null;
                    if (user.role === 'consultant') {
                        consultantInfo = await Consultant.findOne({ user_id: blog.author_id }).lean();
                    }

                    // Kết hợp thông tin author
                    const author = {
                        user_id: user.user_id || user._id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        avatar: user.avatar,
                        ...(consultantInfo && {
                            specialization: consultantInfo.specialization,
                            qualifications: consultantInfo.qualifications,
                            experience_years: consultantInfo.experience_years,
                            consultant_avatar: consultantInfo.consultant_avatar,
                            consultation_rating: consultantInfo.consultation_rating,
                            total_consultations: consultantInfo.total_consultations
                        })
                    };

                    return { ...blog, author };
                })
            );

            return blogsWithAuthor;
        } catch (error) {
            console.error('Error finding blogs with author:', error);
            throw error;
        }
    }

    public static async findById(blogId: number): Promise<IBlog | null> {
        try {
            return await Blog.findOne({ blog_id: blogId }).lean();
        } catch (error) {
            console.error('Error finding blog by id:', error);
            throw error;
        }
    }
}