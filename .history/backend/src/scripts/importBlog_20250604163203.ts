// ============ KIỂM TRA VÀ SỬA DATABASE CONFIG ============

// src/configs/database.ts - Đảm bảo connection string đúng
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GenCare'; // ← Phải là GenCare

export const connectDatabase = async (): Promise<void> => {
    try {
        console.log('🔄 Connecting to database:', MONGODB_URI); // Log để kiểm tra

        await mongoose.connect(MONGODB_URI);

        console.log('✅ Connected to MongoDB:', mongoose.connection.name); // Log tên database
        console.log('📍 Database host:', mongoose.connection.host);
        console.log('📍 Database port:', mongoose.connection.port);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// ============ SCRIPT INSERT VÀO ĐÚNG DATABASE ============

// src/scripts/insertToGenCare.ts
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { Customer } from '../models/Customer';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';

async function insertToGenCare() {
    try {
        // Kết nối trực tiếp tới GenCare database
        const GENCARE_URI = 'mongodb://localhost:27017/GenCare';
        console.log('🔄 Connecting directly to GenCare database...');
        console.log('📍 URI:', GENCARE_URI);

        await mongoose.connect(GENCARE_URI);

        console.log('✅ Connected to MongoDB');
        console.log('📍 Current database:', mongoose.connection.name);
        console.log('📍 Host:', mongoose.connection.host);
        console.log('📍 Port:', mongoose.connection.port);

        // Kiểm tra collections hiện tại
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📂 Current collections:', collections.map(c => c.name));

        // Xóa dữ liệu cũ trong GenCare
        console.log('🗑️ Clearing old data in GenCare...');
        await BlogComment.deleteMany({});
        await Blog.deleteMany({});
        await Customer.deleteMany({});
        await Consultant.deleteMany({});
        await User.deleteMany({});
        console.log('✅ Old data cleared');

        // Insert Users
        console.log('👥 Inserting users into GenCare...');
        const user1 = await User.create({
            email: "bs.nguyenthilan@healthcenter.com",
            password: "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
            full_name: "BS. Nguyễn Thị Lan",
            phone: "0901234567",
            role: "consultant",
            avatar: "https://example.com/avatars/bs_lan.jpg",
            status: true,
            email_verified: true
        });
        console.log('✅ User 1 created:', user1._id);

        const user2 = await User.create({
            email: "ths.tranvanminh@healthcenter.com",
            password: "$2b$10$abcdefghijklmnopqrstuvwxyz987654321",
            full_name: "ThS. Trần Văn Minh",
            phone: "0907654321",
            role: "consultant",
            avatar: "https://example.com/avatars/ths_minh.jpg",
            status: true,
            email_verified: true
        });
        console.log('✅ User 2 created:', user2._id);

        const user3 = await User.create({
            email: "nguyenthihoa@gmail.com",
            password: "$2b$10$customerpassword123456789",
            full_name: "Nguyễn Thị Hoa",
            phone: "0912345678",
            role: "customer",
            avatar: "https://example.com/avatars/customer_25.jpg",
            status: true,
            email_verified: true
        });
        console.log('✅ User 3 created:', user3._id);

        const user4 = await User.create({
            email: "lethimai@gmail.com",
            password: "$2b$10$customerpassword987654321",
            full_name: "Lê Thị Mai",
            phone: "0918765432",
            role: "customer",
            avatar: "https://example.com/avatars/customer_26.jpg",
            status: true,
            email_verified: true
        });
        console.log('✅ User 4 created:', user4._id);

        // Insert Consultants
        console.log('🩺 Inserting consultants into GenCare...');
        const consultant1 = await Consultant.create({
            user_id: user1._id,
            specialization: "Sản phụ khoa",
            qualifications: "Bác sĩ chuyên khoa I Sản phụ khoa",
            experience_years: 8,
            consultation_rating: 4.8,
            total_consultations: 256
        });
        console.log('✅ Consultant 1 created:', consultant1._id);

        const consultant2 = await Consultant.create({
            user_id: user2._id,
            specialization: "Y học dự phòng",
            qualifications: "Thạc sĩ Y học dự phòng",
            experience_years: 5,
            consultation_rating: 4.6,
            total_consultations: 189
        });
        console.log('✅ Consultant 2 created:', consultant2._id);

        // Insert Customers
        console.log('👩‍⚕️ Inserting customers into GenCare...');
        const customer1 = await Customer.create({
            user_id: user3._id,
            medical_history: "Không có bệnh lý đặc biệt",
            custom_avatar: "https://example.com/custom_avatars/customer_25_custom.jpg",
            last_updated: new Date("2024-11-15T14:20:00.000Z")
        });
        console.log('✅ Customer 1 created:', customer1._id);

        const customer2 = await Customer.create({
            user_id: user4._id,
            medical_history: "Tiền sử viêm nhiễm phụ khoa",
            custom_avatar: null,
            last_updated: new Date("2024-12-01T09:30:00.000Z")
        });
        console.log('✅ Customer 2 created:', customer2._id);

        // Insert Blogs
        console.log('📝 Inserting blogs into GenCare...');
        const blog1 = await Blog.create({
            author_id: user1._id,
            title: "Hiểu biết cơ bản về sức khỏe sinh sản ở phụ nữ",
            content: "Sức khỏe sinh sản là một phần quan trọng trong cuộc sống của mỗi phụ nữ. Việc hiểu rõ về chu kỳ kinh nguyệt, các dấu hiệu bất thường và cách chăm sóc bản thân sẽ giúp phụ nữ duy trì sức khỏe tốt nhất.",
            publish_date: new Date("2024-12-01T08:30:00.000Z"),
            updated_date: new Date("2024-12-02T10:15:00.000Z"),
            status: "published"
        });
        console.log('✅ Blog 1 created:', blog1._id);

        const blog2 = await Blog.create({
            author_id: user2._id,
            title: "Phòng tránh các bệnh lây truyền qua đường tình dục (STIs)",
            content: "Các bệnh lây truyền qua đường tình dục (STIs) là mối quan tâm hàng đầu về sức khỏe sinh sản. Bài viết này sẽ cung cấp thông tin chi tiết về các biện pháp phòng tránh hiệu quả.",
            publish_date: new Date("2024-11-28T14:20:00.000Z"),
            updated_date: new Date("2024-11-28T14:20:00.000Z"),
            status: "published"
        });
        console.log('✅ Blog 2 created:', blog2._id);

        const blog3 = await Blog.create({
            author_id: user1._id,
            title: "Hướng dẫn theo dõi chu kỳ kinh nguyệt hiệu quả",
            content: "Theo dõi chu kỳ kinh nguyệt không chỉ giúp phụ nữ hiểu rõ hơn về cơ thể mình mà còn hỗ trợ trong việc kế hoạch hóa gia đình và phát hiện sớm các bất thường.",
            publish_date: new Date("2024-11-25T09:45:00.000Z"),
            updated_date: new Date("2024-11-26T16:30:00.000Z"),
            status: "published"
        });
        console.log('✅ Blog 3 created:', blog3._id);

        // Insert Blog Comments
        console.log('💬 Inserting blog comments into GenCare...');
        const comment1 = await BlogComment.create({
            blog_id: blog1._id,
            customer_id: user3._id,
            content: "Bài viết rất hữu ích! Tôi đã hiểu rõ hơn về chu kỳ kinh nguyệt của mình.",
            comment_date: new Date("2024-12-02T15:30:00.000Z"),
            parent_comment_id: null,
            status: "approved",
            is_anonymous: false
        });
        console.log('✅ Comment 1 created:', comment1._id);

        const comment2 = await BlogComment.create({
            blog_id: blog1._id,
            customer_id: user4._id,
            content: "Mình cũng đồng ý với chị ở trên. Thông tin trong bài rất dễ hiểu và thực tế.",
            comment_date: new Date("2024-12-02T16:45:00.000Z"),
            parent_comment_id: null,
            status: "approved",
            is_anonymous: false
        });
        console.log('✅ Comment 2 created:', comment2._id);

        const comment3 = await BlogComment.create({
            blog_id: blog1._id,
            customer_id: null,
            content: "Tôi muốn hỏi thêm về việc chu kỳ kinh nguyệt không đều thì có cần lo lắng không ạ?",
            comment_date: new Date("2024-12-03T09:20:00.000Z"),
            parent_comment_id: null,
            status: "approved",
            is_anonymous: true
        });
        console.log('✅ Comment 3 created:', comment3._id);

        const comment4 = await BlogComment.create({
            blog_id: blog2._id,
            customer_id: user4._id,
            content: "Thông tin về phòng tránh STIs rất cần thiết. Mong có thêm nhiều bài viết như thế này.",
            comment_date: new Date("2024-11-29T10:20:00.000Z"),
            parent_comment_id: null,
            status: "approved",
            is_anonymous: false
        });
        console.log('✅ Comment 4 created:', comment4._id);

        // Verify final counts
        console.log('🔍 Verifying final counts in GenCare...');
        const [userCount, consultantCount, customerCount, blogCount, commentCount] = await Promise.all([
            User.countDocuments(),
            Consultant.countDocuments(),
            Customer.countDocuments(),
            Blog.countDocuments(),
            BlogComment.countDocuments()
        ]);

        console.log('🎉 FINAL RESULTS IN GENCARE:');
        console.log(`👥 Users: ${userCount}`);
        console.log(`🩺 Consultants: ${consultantCount}`);
        console.log(`👩‍⚕️ Customers: ${customerCount}`);
        console.log(`📝 Blogs: ${blogCount}`);
        console.log(`💬 Comments: ${commentCount}`);

        console.log('🎉 All data inserted successfully into GenCare database!');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error inserting data into GenCare:', error);
        console.error('❌ Error stack:', error.stack);
        process.exit(1);
    }
}

insertToGenCare();

// ============ SCRIPT KIỂM TRA DATABASE HIỆN TẠI ============

// src/scripts/checkCurrentDatabase.ts
import mongoose from 'mongoose';

async function checkCurrentDatabase() {
    try {
        // Load environment variables
        require('dotenv').config();

        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GenCare';
        console.log('🔍 Checking database connection...');
        console.log('📍 Connection URI:', MONGODB_URI);

        await mongoose.connect(MONGODB_URI);

        console.log('✅ Connected to MongoDB');
        console.log('📍 Current database name:', mongoose.connection.name);
        console.log('📍 Host:', mongoose.connection.host);
        console.log('📍 Port:', mongoose.connection.port);

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📂 Available collections:');
        collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
        });

        // Count documents in each collection
        if (collections.length > 0) {
            console.log('\n📊 Document counts:');
            for (const collection of collections) {
                try {
                    const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                    console.log(`   - ${collection.name}: ${count} documents`);
                } catch (error) {
                    console.log(`   - ${collection.name}: Error counting`);
                }
            }
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking database:', error);
        process.exit(1);
    }
}

checkCurrentDatabase();