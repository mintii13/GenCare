// src/scripts/insertStepByStep.ts
import { connectDatabase } from '../configs/database';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { Customer } from '../models/Customer';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';

async function insertStepByStep() {
    try {
        console.log('🔄 Step 1: Connecting to database...');
        await connectDatabase();
        console.log('✅ Database connected');

        // Xóa dữ liệu cũ trước
        console.log('🗑️ Step 2: Clearing old data...');
        await BlogComment.deleteMany({});
        await Blog.deleteMany({});
        await Customer.deleteMany({});
        await Consultant.deleteMany({});
        await User.deleteMany({});
        console.log('✅ All old data cleared');

        // Step 3: Insert Users
        console.log('👥 Step 3: Inserting users...');
        try {
            const user1 = new User({
                email: "bs.nguyenthilan@healthcenter.com",
                password: "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
                full_name: "BS. Nguyễn Thị Lan",
                phone: "0901234567",
                role: "consultant",
                avatar: "https://example.com/avatars/bs_lan.jpg",
                status: true,
                email_verified: true
            });
            await user1.save();
            console.log('✅ User 1 saved:', user1._id);

            const user2 = new User({
                email: "ths.tranvanminh@healthcenter.com",
                password: "$2b$10$abcdefghijklmnopqrstuvwxyz987654321",
                full_name: "ThS. Trần Văn Minh",
                phone: "0907654321",
                role: "consultant",
                avatar: "https://example.com/avatars/ths_minh.jpg",
                status: true,
                email_verified: true
            });
            await user2.save();
            console.log('✅ User 2 saved:', user2._id);

            const user3 = new User({
                email: "nguyenthihoa@gmail.com",
                password: "$2b$10$customerpassword123456789",
                full_name: "Nguyễn Thị Hoa",
                phone: "0912345678",
                role: "customer",
                avatar: "https://example.com/avatars/customer_25.jpg",
                status: true,
                email_verified: true
            });
            await user3.save();
            console.log('✅ User 3 saved:', user3._id);

            const user4 = new User({
                email: "lethimai@gmail.com",
                password: "$2b$10$customerpassword987654321",
                full_name: "Lê Thị Mai",
                phone: "0918765432",
                role: "customer",
                avatar: "https://example.com/avatars/customer_26.jpg",
                status: true,
                email_verified: true
            });
            await user4.save();
            console.log('✅ User 4 saved:', user4._id);

            // Step 4: Insert Consultants
            console.log('🩺 Step 4: Inserting consultants...');

            const consultant1 = new Consultant({
                user_id: user1._id,
                specialization: "Sản phụ khoa",
                qualifications: "Bác sĩ chuyên khoa I Sản phụ khoa",
                experience_years: 8,
                consultation_rating: 4.8,
                total_consultations: 256
            });
            await consultant1.save();
            console.log('✅ Consultant 1 saved:', consultant1._id);

            const consultant2 = new Consultant({
                user_id: user2._id,
                specialization: "Y học dự phòng",
                qualifications: "Thạc sĩ Y học dự phòng",
                experience_years: 5,
                consultation_rating: 4.6,
                total_consultations: 189
            });
            await consultant2.save();
            console.log('✅ Consultant 2 saved:', consultant2._id);

            // Step 5: Insert Customers
            console.log('👩‍⚕️ Step 5: Inserting customers...');

            const customer1 = new Customer({
                user_id: user3._id,
                medical_history: "Không có bệnh lý đặc biệt",
                custom_avatar: "https://example.com/custom_avatars/customer_25_custom.jpg",
                last_updated: new Date("2024-11-15T14:20:00.000Z")
            });
            await customer1.save();
            console.log('✅ Customer 1 saved:', customer1._id);

            const customer2 = new Customer({
                user_id: user4._id,
                medical_history: "Tiền sử viêm nhiễm phụ khoa",
                custom_avatar: null,
                last_updated: new Date("2024-12-01T09:30:00.000Z")
            });
            await customer2.save();
            console.log('✅ Customer 2 saved:', customer2._id);

            // Step 6: Insert Blogs
            console.log('📝 Step 6: Inserting blogs...');

            const blog1 = new Blog({
                author_id: user1._id,
                title: "Hiểu biết cơ bản về sức khỏe sinh sản ở phụ nữ",
                content: "Sức khỏe sinh sản là một phần quan trọng trong cuộc sống của mỗi phụ nữ. Việc hiểu rõ về chu kỳ kinh nguyệt, các dấu hiệu bất thường và cách chăm sóc bản thân sẽ giúp phụ nữ duy trì sức khỏe tốt nhất.",
                publish_date: new Date("2024-12-01T08:30:00.000Z"),
                updated_date: new Date("2024-12-02T10:15:00.000Z"),
                status: "published"
            });
            await blog1.save();
            console.log('✅ Blog 1 saved:', blog1._id);

            const blog2 = new Blog({
                author_id: user2._id,
                title: "Phòng tránh các bệnh lây truyền qua đường tình dục (STIs)",
                content: "Các bệnh lây truyền qua đường tình dục (STIs) là mối quan tâm hàng đầu về sức khỏe sinh sản. Bài viết này sẽ cung cấp thông tin chi tiết về các biện pháp phòng tránh hiệu quả.",
                publish_date: new Date("2024-11-28T14:20:00.000Z"),
                updated_date: new Date("2024-11-28T14:20:00.000Z"),
                status: "published"
            });
            await blog2.save();
            console.log('✅ Blog 2 saved:', blog2._id);

            const blog3 = new Blog({
                author_id: user1._id,
                title: "Hướng dẫn theo dõi chu kỳ kinh nguyệt hiệu quả",
                content: "Theo dõi chu kỳ kinh nguyệt không chỉ giúp phụ nữ hiểu rõ hơn về cơ thể mình mà còn hỗ trợ trong việc kế hoạch hóa gia đình và phát hiện sớm các bất thường.",
                publish_date: new Date("2024-11-25T09:45:00.000Z"),
                updated_date: new Date("2024-11-26T16:30:00.000Z"),
                status: "published"
            });
            await blog3.save();
            console.log('✅ Blog 3 saved:', blog3._id);

            // Step 7: Insert Blog Comments
            console.log('💬 Step 7: Inserting blog comments...');

            const comment1 = new BlogComment({
                blog_id: blog1._id,
                customer_id: user3._id,
                content: "Bài viết rất hữu ích! Tôi đã hiểu rõ hơn về chu kỳ kinh nguyệt của mình.",
                comment_date: new Date("2024-12-02T15:30:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            });
            await comment1.save();
            console.log('✅ Comment 1 saved:', comment1._id);

            const comment2 = new BlogComment({
                blog_id: blog1._id,
                customer_id: user4._id,
                content: "Mình cũng đồng ý với chị ở trên. Thông tin trong bài rất dễ hiểu và thực tế.",
                comment_date: new Date("2024-12-02T16:45:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            });
            await comment2.save();
            console.log('✅ Comment 2 saved:', comment2._id);

            const comment3 = new BlogComment({
                blog_id: blog1._id,
                customer_id: null,
                content: "Tôi muốn hỏi thêm về việc chu kỳ kinh nguyệt không đều thì có cần lo lắng không ạ?",
                comment_date: new Date("2024-12-03T09:20:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: true
            });
            await comment3.save();
            console.log('✅ Comment 3 saved:', comment3._id);

            const comment4 = new BlogComment({
                blog_id: blog2._id,
                customer_id: user4._id,
                content: "Thông tin về phòng tránh STIs rất cần thiết. Mong có thêm nhiều bài viết như thế này.",
                comment_date: new Date("2024-11-29T10:20:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            });
            await comment4.save();
            console.log('✅ Comment 4 saved:', comment4._id);

            // Step 8: Verify final counts
            console.log('🔍 Step 8: Verifying final counts...');
            const [userCount, consultantCount, customerCount, blogCount, commentCount] = await Promise.all([
                User.countDocuments(),
                Consultant.countDocuments(),
                Customer.countDocuments(),
                Blog.countDocuments(),
                BlogComment.countDocuments()
            ]);

            console.log('🎉 FINAL RESULTS:');
            console.log(`👥 Users: ${userCount}`);
            console.log(`🩺 Consultants: ${consultantCount}`);
            console.log(`👩‍⚕️ Customers: ${customerCount}`);
            console.log(`📝 Blogs: ${blogCount}`);
            console.log(`💬 Comments: ${commentCount}`);

            console.log('🎉 All data inserted successfully!');

        } catch (userError) {
            console.error('❌ Error in user/consultant/customer insertion:', userError);
            throw userError;
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        console.error('❌ Error stack:', error.stack);
        process.exit(1);
    }
}

insertStepByStep();

// ============ KIỂM TRA SCHEMA VALIDATION ============

// src/scripts/testSchemas.ts
import { connectDatabase } from '../configs/database';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { Customer } from '../models/Customer';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';

async function testSchemas() {
    try {
        await connectDatabase();
        console.log('✅ Database connected');

        // Test User schema
        console.log('🧪 Testing User schema...');
        const testUser = new User({
            email: "test@test.com",
            full_name: "Test User",
            role: "customer",
            status: true,
            email_verified: true
        });

        const validationResult = testUser.validateSync();
        if (validationResult) {
            console.log('❌ User validation error:', validationResult.errors);
        } else {
            console.log('✅ User schema validation passed');
        }

        // Test Blog schema
        console.log('🧪 Testing Blog schema...');
        const testBlog = new Blog({
            author_id: testUser._id,
            title: "Test Blog",
            content: "Test content",
            status: "published"
        });

        const blogValidation = testBlog.validateSync();
        if (blogValidation) {
            console.log('❌ Blog validation error:', blogValidation.errors);
        } else {
            console.log('✅ Blog schema validation passed');
        }

        // Test BlogComment schema
        console.log('🧪 Testing BlogComment schema...');
        const testComment = new BlogComment({
            blog_id: testBlog._id,
            customer_id: testUser._id,
            content: "Test comment",
            status: "approved",
            is_anonymous: false
        });

        const commentValidation = testComment.validateSync();
        if (commentValidation) {
            console.log('❌ Comment validation error:', commentValidation.errors);
        } else {
            console.log('✅ Comment schema validation passed');
        }

        console.log('🎉 All schema tests completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema test error:', error);
        process.exit(1);
    }
}

// Uncomment to run schema test
// testSchemas();