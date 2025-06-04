// src/scripts/insertBlogDataDebug.ts
import { connectDatabase } from '../configs/database';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { Customer } from '../models/Customer';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';

async function insertBlogDataDebug() {
    try {
        console.log('🔄 Connecting to database...');
        await connectDatabase();
        console.log('✅ Database connected successfully');

        // Kiểm tra connection
        const collections = await Promise.all([
            User.countDocuments(),
            Consultant.countDocuments(),
            Customer.countDocuments(),
            Blog.countDocuments(),
            BlogComment.countDocuments()
        ]);
        console.log('📊 Current collections count:', {
            users: collections[0],
            consultants: collections[1],
            customers: collections[2],
            blogs: collections[3],
            blogComments: collections[4]
        });

        // Xóa dữ liệu cũ
        console.log('🗑️ Clearing old data...');
        await BlogComment.deleteMany({});
        console.log('✅ Cleared blog_comments');

        await Blog.deleteMany({});
        console.log('✅ Cleared blogs');

        await Customer.deleteMany({});
        console.log('✅ Cleared customers');

        await Consultant.deleteMany({});
        console.log('✅ Cleared consultants');

        await User.deleteMany({});
        console.log('✅ Cleared users');

        // Insert Users
        console.log('👥 Inserting users...');
        const usersData = [
            {
                email: "bs.nguyenthilan@healthcenter.com",
                password: "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
                full_name: "BS. Nguyễn Thị Lan",
                phone: "0901234567",
                role: "consultant",
                avatar: "https://example.com/avatars/bs_lan.jpg",
                status: true,
                email_verified: true
            },
            {
                email: "ths.tranvanminh@healthcenter.com",
                password: "$2b$10$abcdefghijklmnopqrstuvwxyz987654321",
                full_name: "ThS. Trần Văn Minh",
                phone: "0907654321",
                role: "consultant",
                avatar: "https://example.com/avatars/ths_minh.jpg",
                status: true,
                email_verified: true
            },
            {
                email: "nguyenthihoa@gmail.com",
                password: "$2b$10$customerpassword123456789",
                full_name: "Nguyễn Thị Hoa",
                phone: "0912345678",
                role: "customer",
                avatar: "https://example.com/avatars/customer_25.jpg",
                status: true,
                email_verified: true
            },
            {
                email: "lethimai@gmail.com",
                password: "$2b$10$customerpassword987654321",
                full_name: "Lê Thị Mai",
                phone: "0918765432",
                role: "customer",
                avatar: "https://example.com/avatars/customer_26.jpg",
                status: true,
                email_verified: true
            }
        ];

        const insertedUsers = await User.insertMany(usersData);
        console.log(`✅ ${insertedUsers.length} users inserted`);

        // Log user IDs
        insertedUsers.forEach(user => {
            console.log(`👤 ${user.full_name}: ${user._id}`);
        });

        // Lấy ObjectId của users
        const lanUser = insertedUsers.find(u => u.email === "bs.nguyenthilan@healthcenter.com");
        const minhUser = insertedUsers.find(u => u.email === "ths.tranvanminh@healthcenter.com");
        const hoaUser = insertedUsers.find(u => u.email === "nguyenthihoa@gmail.com");
        const maiUser = insertedUsers.find(u => u.email === "lethimai@gmail.com");

        if (!lanUser || !minhUser || !hoaUser || !maiUser) {
            throw new Error('❌ Some users not found after insert');
        }

        // Insert Consultants
        console.log('🩺 Inserting consultants...');
        const consultantsData = [
            {
                user_id: lanUser._id,
                specialization: "Sản phụ khoa",
                qualifications: "Bác sĩ chuyên khoa I Sản phụ khoa",
                experience_years: 8,
                consultation_rating: 4.8,
                total_consultations: 256
            },
            {
                user_id: minhUser._id,
                specialization: "Y học dự phòng",
                qualifications: "Thạc sĩ Y học dự phòng",
                experience_years: 5,
                consultation_rating: 4.6,
                total_consultations: 189
            }
        ];

        const insertedConsultants = await Consultant.insertMany(consultantsData);
        console.log(`✅ ${insertedConsultants.length} consultants inserted`);

        // Insert Customers
        console.log('👩‍⚕️ Inserting customers...');
        const customersData = [
            {
                user_id: hoaUser._id,
                medical_history: "Không có bệnh lý đặc biệt",
                custom_avatar: "https://example.com/custom_avatars/customer_25_custom.jpg",
                last_updated: new Date("2024-11-15T14:20:00.000Z")
            },
            {
                user_id: maiUser._id,
                medical_history: "Tiền sử viêm nhiễm phụ khoa",
                custom_avatar: null,
                last_updated: new Date("2024-12-01T09:30:00.000Z")
            }
        ];

        const insertedCustomers = await Customer.insertMany(customersData);
        console.log(`✅ ${insertedCustomers.length} customers inserted`);

        // Insert Blogs
        console.log('📝 Inserting blogs...');
        const blogsData = [
            {
                author_id: lanUser._id,
                title: "Hiểu biết cơ bản về sức khỏe sinh sản ở phụ nữ",
                content: "Sức khỏe sinh sản là một phần quan trọng trong cuộc sống của mỗi phụ nữ. Việc hiểu rõ về chu kỳ kinh nguyệt, các dấu hiệu bất thường và cách chăm sóc bản thân sẽ giúp phụ nữ duy trì sức khỏe tốt nhất.",
                publish_date: new Date("2024-12-01T08:30:00.000Z"),
                updated_date: new Date("2024-12-02T10:15:00.000Z"),
                status: "published"
            },
            {
                author_id: minhUser._id,
                title: "Phòng tránh các bệnh lây truyền qua đường tình dục (STIs)",
                content: "Các bệnh lây truyền qua đường tình dục (STIs) là mối quan tâm hàng đầu về sức khỏe sinh sản. Bài viết này sẽ cung cấp thông tin chi tiết về các biện pháp phòng tránh hiệu quả.",
                publish_date: new Date("2024-11-28T14:20:00.000Z"),
                updated_date: new Date("2024-11-28T14:20:00.000Z"),
                status: "published"
            },
            {
                author_id: lanUser._id,
                title: "Hướng dẫn theo dõi chu kỳ kinh nguyệt hiệu quả",
                content: "Theo dõi chu kỳ kinh nguyệt không chỉ giúp phụ nữ hiểu rõ hơn về cơ thể mình mà còn hỗ trợ trong việc kế hoạch hóa gia đình và phát hiện sớm các bất thường.",
                publish_date: new Date("2024-11-25T09:45:00.000Z"),
                updated_date: new Date("2024-11-26T16:30:00.000Z"),
                status: "published"
            }
        ];

        const insertedBlogs = await Blog.insertMany(blogsData);
        console.log(`✅ ${insertedBlogs.length} blogs inserted`);

        // Log blog IDs
        insertedBlogs.forEach(blog => {
            console.log(`📝 ${blog.title.substring(0, 30)}...: ${blog._id}`);
        });

        // Insert Blog Comments
        console.log('💬 Inserting blog comments...');
        const commentsData = [
            {
                blog_id: insertedBlogs[0]._id,
                customer_id: hoaUser._id,
                content: "Bài viết rất hữu ích! Tôi đã hiểu rõ hơn về chu kỳ kinh nguyệt của mình.",
                comment_date: new Date("2024-12-02T15:30:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            },
            {
                blog_id: insertedBlogs[0]._id,
                customer_id: maiUser._id,
                content: "Mình cũng đồng ý với chị ở trên. Thông tin trong bài rất dễ hiểu và thực tế.",
                comment_date: new Date("2024-12-02T16:45:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            },
            {
                blog_id: insertedBlogs[0]._id,
                customer_id: null,
                content: "Tôi muốn hỏi thêm về việc chu kỳ kinh nguyệt không đều thì có cần lo lắng không ạ?",
                comment_date: new Date("2024-12-03T09:20:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: true
            },
            {
                blog_id: insertedBlogs[1]._id,
                customer_id: maiUser._id,
                content: "Thông tin về phòng tránh STIs rất cần thiết. Mong có thêm nhiều bài viết như thế này.",
                comment_date: new Date("2024-11-29T10:20:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            }
        ];

        const insertedComments = await BlogComment.insertMany(commentsData);
        console.log(`✅ ${insertedComments.length} blog comments inserted`);

        // Kiểm tra kết quả cuối cùng
        const finalCounts = await Promise.all([
            User.countDocuments(),
            Consultant.countDocuments(),
            Customer.countDocuments(),
            Blog.countDocuments(),
            BlogComment.countDocuments()
        ]);

        console.log('🎉 Final collections count:', {
            users: finalCounts[0],
            consultants: finalCounts[1],
            customers: finalCounts[2],
            blogs: finalCounts[3],
            blogComments: finalCounts[4]
        });

        console.log('🎉 All data inserted successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error inserting data:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

insertBlogDataDebug();

