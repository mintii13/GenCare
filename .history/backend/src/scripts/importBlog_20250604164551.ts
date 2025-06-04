import { connectDatabase } from '../configs/database';
import { User } from '../models/User';
import { Consultant } from '../models/Consultant';
import { Customer } from '../models/Customer';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';
import * as fs from 'fs';
import * as path from 'path';

async function importBlogsSmartReference() {
    try {
        // Kết nối database
        await connectDatabase();
        console.log('✅ Database connected');

        // Đọc file JSON
        const usersJsonPath = path.join(__dirname, '../../../UsersDB.json');
        const consultantsJsonPath = path.join(__dirname, '../../../ConsultantsDB.json');
        const customersJsonPath = path.join(__dirname, '../../../CustomersDB.json');
        const blogsJsonPath = path.join(__dirname, '../../../BlogsDB.json');
        const commentsJsonPath = path.join(__dirname, '../../../BlogCommentsDB.json');

        const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf-8'));
        const consultantsData = JSON.parse(fs.readFileSync(consultantsJsonPath, 'utf-8'));
        const customersData = JSON.parse(fs.readFileSync(customersJsonPath, 'utf-8'));
        const blogsData = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf-8'));
        const commentsData = JSON.parse(fs.readFileSync(commentsJsonPath, 'utf-8'));

        // Xóa dữ liệu cũ
        console.log('🗑️ Clearing old data...');
        await BlogComment.deleteMany({});
        await Blog.deleteMany({});
        await Customer.deleteMany({});
        await Consultant.deleteMany({});
        await User.deleteMany({});

        // BƯỚC 1: Import Users và lưu mapping
        console.log('👥 Importing users...');
        const userEmailToId = new Map(); // Map email -> ObjectId
        const userRoleToId = new Map(); // Map role -> Array of ObjectIds

        for (const userData of usersData) {
            try {
                console.log('Đang thêm user:', userData.email);

                const user = new User(userData);
                await user.save();

                // Lưu mapping email -> ObjectId
                userEmailToId.set(userData.email, user._id);

                // Lưu mapping role -> ObjectId array
                if (!userRoleToId.has(userData.role)) {
                    userRoleToId.set(userData.role, []);
                }
                userRoleToId.get(userData.role).push({
                    id: user._id,
                    email: userData.email,
                    full_name: userData.full_name
                });

                console.log(`✅ Đã thêm user: ${user.email} (ID: ${user._id})`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm user ${userData.email}:`, error.message);
            }
        }

        // Log mapping để debug
        console.log('\n📋 User Role Mapping:');
        for (const [role, users] of userRoleToId.entries()) {
            console.log(`${role}:`);
            users.forEach(user => console.log(`  - ${user.full_name} (${user.email}): ${user.id}`));
        }

        // BƯỚC 2: Import Consultants với user_id tự động
        console.log('\n🩺 Importing consultants...');
        const consultantUsers = userRoleToId.get('consultant') || [];

        for (let i = 0; i < consultantsData.length && i < consultantUsers.length; i++) {
            try {
                const consultantData = consultantsData[i];
                const consultantUser = consultantUsers[i];

                console.log(`Đang thêm consultant cho user: ${consultantUser.full_name}`);

                const consultant = new Consultant({
                    ...consultantData,
                    user_id: consultantUser.id // Tự động gán user_id
                });
                await consultant.save();

                console.log(`✅ Đã thêm consultant: ${consultant._id} (User: ${consultantUser.full_name})`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm consultant:`, error.message);
            }
        }

        // BƯỚC 3: Import Customers với user_id tự động  
        console.log('\n👩‍⚕️ Importing customers...');
        const customerUsers = userRoleToId.get('customer') || [];

        for (let i = 0; i < customersData.length && i < customerUsers.length; i++) {
            try {
                const customerData = customersData[i];
                const customerUser = customerUsers[i];

                console.log(`Đang thêm customer cho user: ${customerUser.full_name}`);

                const customer = new Customer({
                    ...customerData,
                    user_id: customerUser.id // Tự động gán user_id
                });
                await customer.save();

                console.log(`✅ Đã thêm customer: ${customer._id} (User: ${customerUser.full_name})`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm customer:`, error.message);
            }
        }

        // BƯỚC 4: Import Blogs với author_id tự động
        console.log('\n📝 Importing blogs...');
        const blogIdMapping = new Map(); // Map blog index -> ObjectId

        for (let i = 0; i < blogsData.length; i++) {
            try {
                const blogData = blogsData[i];

                // Tự động gán author_id từ consultant users
                const authorIndex = blogData.author_index || i % consultantUsers.length;
                const author = consultantUsers[authorIndex];

                console.log(`Đang thêm blog: ${blogData.title} (Author: ${author.full_name})`);

                const blog = new Blog({
                    ...blogData,
                    author_id: author.id // Tự động gán author_id
                });
                delete blog.author_index; // Xóa field tạm

                await blog.save();
                blogIdMapping.set(i, blog._id);

                console.log(`✅ Đã thêm blog: ${blog.title} (ID: ${blog._id})`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm blog:`, error.message);
            }
        }

        // BƯỚC 5: Import Blog Comments với references tự động
        console.log('\n💬 Importing blog comments...');

        for (const commentData of commentsData) {
            try {
                let customer_id = null;

                // Nếu không phải anonymous comment
                if (!commentData.is_anonymous && commentData.customer_index !== undefined) {
                    const customerIndex = commentData.customer_index;
                    if (customerUsers[customerIndex]) {
                        customer_id = customerUsers[customerIndex].id;
                    }
                }

                // Lấy blog_id từ mapping
                const blog_id = blogIdMapping.get(commentData.blog_index || 0);

                console.log(`Đang thêm comment cho blog index ${commentData.blog_index}`);

                const comment = new BlogComment({
                    ...commentData,
                    blog_id: blog_id,
                    customer_id: customer_id
                });

                // Xóa các field tạm
                delete comment.blog_index;
                delete comment.customer_index;

                await comment.save();

                console.log(`✅ Đã thêm comment: ${comment._id}`);
            } catch (error) {
                console.error(`❌ Lỗi khi thêm comment:`, error.message);
            }
        }

        // Kiểm tra kết quả cuối cùng
        console.log('\n🔍 Kiểm tra kết quả...');
        const [userCount, consultantCount, customerCount, blogCount, commentCount] = await Promise.all([
            User.countDocuments(),
            Consultant.countDocuments(),
            Customer.countDocuments(),
            Blog.countDocuments(),
            BlogComment.countDocuments()
        ]);

        console.log('\n🎉 KẾT QUẢ IMPORT:');
        console.log(`👥 Users: ${userCount}`);
        console.log(`🩺 Consultants: ${consultantCount}`);
        console.log(`👩‍⚕️ Customers: ${customerCount}`);
        console.log(`📝 Blogs: ${blogCount}`);
        console.log(`💬 Comments: ${commentCount}`);

        console.log('\n🎉 Hoàn thành import dữ liệu blog');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi import dữ liệu blog:', error);
        console.error('❌ Error stack:', error.stack);
        process.exit(1);
    }
}

importBlogsSmartReference();