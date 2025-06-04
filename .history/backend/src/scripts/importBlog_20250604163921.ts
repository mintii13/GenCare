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
