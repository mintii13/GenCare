import { connectDatabase } from '../configs/database';
import { User } from '../models/User';
import * as fs from 'fs';
import * as path from 'path';

async function importUsers() {
    try {
        // Kết nối database
        await connectDatabase();

        // Đọc file JSON
        const jsonPath = path.join(__dirname, '../../../LoginDB.json');
        const usersData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        // Xóa dữ liệu cũ
        await User.deleteMany({});

        // Thêm dữ liệu mới từng user một
        for (const userData of usersData) {
            try {
                console.log('Đang thêm user:', userData.email);
                console.log('Dữ liệu user:', JSON.stringify(userData, null, 2));
                
                const user = new User(userData);
                await user.save();
                console.log(`Đã thêm user: ${user.email}`);
            } catch (error) {
                console.error(`Lỗi khi thêm user ${userData.email}:`);
                console.error('Chi tiết lỗi:', error);
                if (error.code === 11000) {
                    console.error('Lỗi trùng lặp key:', error.keyValue);
                }
            }
        }

        console.log('Hoàn thành import dữ liệu');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi import dữ liệu:', error);
        process.exit(1);
    }
}

importUsers(); 