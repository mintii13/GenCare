// src/scripts/importBlogs.ts
import { connectDatabase } from '../configs/database';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { Customer } from '../models/Customer';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';
import * as fs from 'fs';
import * as path from 'path';

async function importBlogs() {
    try {
        // Kết nối database
        await connectDatabase();
        console.log('✅ Database connected');

        // Đọc file JSON cho Users
        const usersJsonPath = path.join(__dirname, '../../../UsersDB.json');
        const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf-8'));

        // Đọc file JSON cho Consultants
        const consultantsJsonPath = path.join(__dirname, '../../../ConsultantsDB.json');
        const consultantsData = JSON.parse(fs.readFileSync(consultantsJsonPath, 'utf-8'));

        // Đọc file JSON cho Customers
        const customersJsonPath = path.join(__dirname, '../../../CustomersDB.json');
        const customersData = JSON.parse(fs.readFileSync(customersJsonPath, 'utf-8'));

        // Đọc file JSON cho Blogs
        const blogsJsonPath = path.join(__dirname, '../../../BlogsDB.json');
        const blogsData = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf-8'));

        // Đọc file JSON cho Blog Comments
        const commentsJsonPath = path.join(__dirname, '../../../BlogCommentsDB.json');
        const commentsData = JSON.parse(fs.readFileSync(commentsJsonPath, 'utf-8'));

        // Xóa dữ liệu cũ
        console.log('🗑️ Clearing old data...');
        await BlogComment.deleteMany({});
        await Blog.deleteMany({});
        await Customer.deleteMany({});
        await Consultant.deleteMany({});
        await User.deleteMany({});

        // Import Users
        console.log('👥 Importing users...');
        for (const userData of usersData) {
            try {
                console.log('Đang thêm user:', userData.email);
                console.log('Dữ liệu user:', JSON.stringify(userData, null, 2));

                const user = new User(userData);
                await user.save();
                console.log(`✅ Đã thêm user: ${user.email}`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm user ${userData.email}:`);
                console.error('Chi tiết lỗi:', error);
                if (error.code === 11000) {
                    console.error('Lỗi trùng lặp key:', error.keyValue);
                }
            }
        }

        // Import Consultants
        console.log('🩺 Importing consultants...');
        for (const consultantData of consultantsData) {
            try {
                console.log('Đang thêm consultant cho user_id:', consultantData.user_id);
                console.log('Dữ liệu consultant:', JSON.stringify(consultantData, null, 2));

                const consultant = new Consultant(consultantData);
                await consultant.save();
                console.log(`✅ Đã thêm consultant: ${consultant._id}`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm consultant ${consultantData.user_id}:`);
                console.error('Chi tiết lỗi:', error);
                if (error.code === 11000) {
                    console.error('Lỗi trùng lặp key:', error.keyValue);
                }
            }
        }

        // Import Customers
        console.log('👩‍⚕️ Importing customers...');
        for (const customerData of customersData) {
            try {
                console.log('Đang thêm customer cho user_id:', customerData.user_id);
                console.log('Dữ liệu customer:', JSON.stringify(customerData, null, 2));

                const customer = new Customer(customerData);
                await customer.save();
                console.log(`✅ Đã thêm customer: ${customer._id}`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm customer ${customerData.user_id}:`);
                console.error('Chi tiết lỗi:', error);
                if (error.code === 11000) {
                    console.error('Lỗi trùng lặp key:', error.keyValue);
                }
            }
        }

        // Import Blogs
        console.log('📝 Importing blogs...');
        for (const blogData of blogsData) {
            try {
                console.log('Đang thêm blog:', blogData.title);
                console.log('Dữ liệu blog:', JSON.stringify(blogData, null, 2));

                const blog = new Blog(blogData);
                await blog.save();
                console.log(`✅ Đã thêm blog: ${blog.title}`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm blog ${blogData.title}:`);
                console.error('Chi tiết lỗi:', error);
                if (error.code === 11000) {
                    console.error('Lỗi trùng lặp key:', error.keyValue);
                }
            }
        }

        // Import Blog Comments
        console.log('💬 Importing blog comments...');
        for (const commentData of commentsData) {
            try {
                console.log('Đang thêm comment cho blog_id:', commentData.blog_id);
                console.log('Dữ liệu comment:', JSON.stringify(commentData, null, 2));

                const comment = new BlogComment(commentData);
                await comment.save();
                console.log(`✅ Đã thêm comment: ${comment._id}`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm comment cho blog ${commentData.blog_id}:`);
                console.error('Chi tiết lỗi:', error);
                if (error.code === 11000) {
                    console.error('Lỗi trùng lặp key:', error.keyValue);
                }
            }
        }

        // Kiểm tra kết quả cuối cùng
        console.log('🔍 Kiểm tra kết quả...');
        const [userCount, consultantCount, customerCount, blogCount, commentCount] = await Promise.all([
            User.countDocuments(),
            Consultant.countDocuments(),
            Customer.countDocuments(),
            Blog.countDocuments(),
            BlogComment.countDocuments()
        ]);

        console.log('🎉 KẾT QUẢ IMPORT:');
        console.log(`👥 Users: ${userCount}`);
        console.log(`🩺 Consultants: ${consultantCount}`);
        console.log(`👩‍⚕️ Customers: ${customerCount}`);
        console.log(`📝 Blogs: ${blogCount}`);
        console.log(`💬 Comments: ${commentCount}`);

        console.log('🎉 Hoàn thành import dữ liệu blog');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi import dữ liệu blog:', error);
        console.error('❌ Error stack:', error.stack);
        process.exit(1);
    }
}

importBlogs();

// ============ TẠO FILE JSON MẪU ============

// UsersDB.json
/*
[
  {
    "email": "bs.nguyenthilan@healthcenter.com",
    "password": "$2b$10$abcdefghijklmnopqrstuvwxyz123456789",
    "full_name": "BS. Nguyễn Thị Lan",
    "phone": "0901234567",
    "role": "consultant",
    "avatar": "https://example.com/avatars/bs_lan.jpg",
    "status": true,
    "email_verified": true,
    "registration_date": "2024-01-15T08:00:00.000Z",
    "updated_date": "2024-12-01T10:30:00.000Z"
  },
  {
    "email": "ths.tranvanminh@healthcenter.com",
    "password": "$2b$10$abcdefghijklmnopqrstuvwxyz987654321",
    "full_name": "ThS. Trần Văn Minh",
    "phone": "0907654321",
    "role": "consultant",
    "avatar": "https://example.com/avatars/ths_minh.jpg",
    "status": true,
    "email_verified": true,
    "registration_date": "2024-02-20T09:15:00.000Z",
    "updated_date": "2024-11-28T14:00:00.000Z"
  },
  {
    "email": "nguyenthihoa@gmail.com",
    "password": "$2b$10$customerpassword123456789",
    "full_name": "Nguyễn Thị Hoa",
    "phone": "0912345678",
    "role": "customer",
    "avatar": "https://example.com/avatars/customer_25.jpg",
    "status": true,
    "email_verified": true,
    "registration_date": "2024-06-10T14:30:00.000Z",
    "updated_date": "2024-12-02T15:00:00.000Z"
  },
  {
    "email": "lethimai@gmail.com",
    "password": "$2b$10$customerpassword987654321",
    "full_name": "Lê Thị Mai",
    "phone": "0918765432",
    "role": "customer",
    "avatar": "https://example.com/avatars/customer_26.jpg",
    "status": true,
    "email_verified": true,
    "registration_date": "2024-07-05T10:20:00.000Z",
    "updated_date": "2024-12-02T16:00:00.000Z"
  }
]
*/

// ConsultantsDB.json
/*
[
  {
    "user_id": "USER_OBJECTID_1_HERE",
    "specialization": "Sản phụ khoa",
    "qualifications": "Bác sĩ chuyên khoa I Sản phụ khoa",
    "experience_years": 8,
    "consultation_rating": 4.8,
    "total_consultations": 256
  },
  {
    "user_id": "USER_OBJECTID_2_HERE",
    "specialization": "Y học dự phòng",
    "qualifications": "Thạc sĩ Y học dự phòng",
    "experience_years": 5,
    "consultation_rating": 4.6,
    "total_consultations": 189
  }
]
*/

// CustomersDB.json
/*
[
  {
    "user_id": "USER_OBJECTID_3_HERE",
    "medical_history": "Không có bệnh lý đặc biệt",
    "custom_avatar": "https://example.com/custom_avatars/customer_25_custom.jpg",
    "last_updated": "2024-11-15T14:20:00.000Z"
  },
  {
    "user_id": "USER_OBJECTID_4_HERE",
    "medical_history": "Tiền sử viêm nhiễm phụ khoa",
    "custom_avatar": null,
    "last_updated": "2024-12-01T09:30:00.000Z"
  }
]
*/

// BlogsDB.json
/*
[
  {
    "author_id": "USER_OBJECTID_1_HERE",
    "title": "Hiểu biết cơ bản về sức khỏe sinh sản ở phụ nữ",
    "content": "Sức khỏe sinh sản là một phần quan trọng trong cuộc sống của mỗi phụ nữ. Việc hiểu rõ về chu kỳ kinh nguyệt, các dấu hiệu bất thường và cách chăm sóc bản thân sẽ giúp phụ nữ duy trì sức khỏe tốt nhất.",
    "publish_date": "2024-12-01T08:30:00.000Z",
    "updated_date": "2024-12-02T10:15:00.000Z",
    "status": "published"
  },
  {
    "author_id": "USER_OBJECTID_2_HERE",
    "title": "Phòng tránh các bệnh lây truyền qua đường tình dục (STIs)",
    "content": "Các bệnh lây truyền qua đường tình dục (STIs) là mối quan tâm hàng đầu về sức khỏe sinh sản. Bài viết này sẽ cung cấp thông tin chi tiết về các biện pháp phòng tránh hiệu quả.",
    "publish_date": "2024-11-28T14:20:00.000Z",
    "updated_date": "2024-11-28T14:20:00.000Z",
    "status": "published"
  },
  {
    "author_id": "USER_OBJECTID_1_HERE",
    "title": "Hướng dẫn theo dõi chu kỳ kinh nguyệt hiệu quả",
    "content": "Theo dõi chu kỳ kinh nguyệt không chỉ giúp phụ nữ hiểu rõ hơn về cơ thể mình mà còn hỗ trợ trong việc kế hoạch hóa gia đình và phát hiện sớm các bất thường.",
    "publish_date": "2024-11-25T09:45:00.000Z",
    "updated_date": "2024-11-26T16:30:00.000Z",
    "status": "published"
  }
]
*/

// BlogCommentsDB.json
/*
[
  {
    "blog_id": "BLOG_OBJECTID_1_HERE",
    "customer_id": "USER_OBJECTID_3_HERE",
    "content": "Bài viết rất hữu ích! Tôi đã hiểu rõ hơn về chu kỳ kinh nguyệt của mình.",
    "comment_date": "2024-12-02T15:30:00.000Z",
    "parent_comment_id": null,
    "status": "approved",
    "is_anonymous": false
  },
  {
    "blog_id": "BLOG_OBJECTID_1_HERE",
    "customer_id": "USER_OBJECTID_4_HERE",
    "content": "Mình cũng đồng ý với chị ở trên. Thông tin trong bài rất dễ hiểu và thực tế.",
    "comment_date": "2024-12-02T16:45:00.000Z",
    "parent_comment_id": null,
    "status": "approved",
    "is_anonymous": false
  },
  {
    "blog_id": "BLOG_OBJECTID_1_HERE",
    "customer_id": null,
    "content": "Tôi muốn hỏi thêm về việc chu kỳ kinh nguyệt không đều thì có cần lo lắng không ạ?",
    "comment_date": "2024-12-03T09:20:00.000Z",
    "parent_comment_id": null,
    "status": "approved",
    "is_anonymous": true
  },
  {
    "blog_id": "BLOG_OBJECTID_2_HERE",
    "customer_id": "USER_OBJECTID_4_HERE",
    "content": "Thông tin về phòng tránh STIs rất cần thiết. Mong có thêm nhiều bài viết như thế này.",
    "comment_date": "2024-11-29T10:20:00.000Z",
    "parent_comment_id": null,
    "status": "approved",
    "is_anonymous": false
  }
]
*/