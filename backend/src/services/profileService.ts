import {IUser, User} from '../models/User'
import { Request, Response} from 'express';
import fs from 'fs';
import path from 'path';
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as IUser)._id;
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
            return;
        }

        res.json({
            success: true,
            message: 'Lấy thông tin profile thành công',
            data: {
                avatar: user.avatar,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                date_of_birth: user.date_of_birth,
                gender: user.gender
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin profile',
        });
        throw error;
    }
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?.userId;
        console.log(userId);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Không trao quyền' });
            return;
        }
        const { full_name, phone, date_of_birth, gender} = req.body;

        const updateData: Partial<IUser> = {};
        if (full_name) updateData.full_name = full_name;
        if (phone) updateData.phone = phone;
        if (date_of_birth) updateData.date_of_birth = date_of_birth;
        if (gender) updateData.gender = gender;
        if (req.file) {
            //xóa ảnh cũ sau khi update
            const existingUser = await User.findById(userId);
            if (existingUser?.avatar) {
                const oldAvatarPath = path.resolve(existingUser.avatar);
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                }
            }
            //update ảnh mới
            updateData.avatar = req.file.path.replace(/\\/g, '/'); // Đường dẫn ảnh
        }
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
            return;
        }

        res.json({
            success: true,
            message: 'Cập nhật profile thành công',
            data: {
                avatar: updatedUser.avatar,
                email: updatedUser.email,
                full_name: updatedUser.full_name,
                phone: updatedUser.phone,
                date_of_birth: updatedUser.date_of_birth,
                gender: updatedUser.gender
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật profile',
        });
    }
};

// export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const userId = (req.user as any).userId;
        
//         if (!req.file) {
//             res.status(400).json({
//                 success: false,
//                 message: 'Vui lòng chọn file hình ảnh'
//             });
//             return;
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             res.status(404).json({
//                 success: false,
//                 message: 'Không tìm thấy người dùng'
//             });
//             return;
//         }

//         // Xóa avatar cũ nếu có
//         if (user.avatar) {
//             const oldAvatarPath = path.join(process.cwd(), user.avatar);
//             if (fs.existsSync(oldAvatarPath)) {
//                 fs.unlinkSync(oldAvatarPath);
//             }
//         }

//         // Cập nhật đường dẫn avatar mới
//         const avatarPath = `uploads/avatars/${req.file.filename}`;
//         user.avatar = avatarPath;
//         await user.save();

//         res.json({
//             success: true,
//             message: 'Upload avatar thành công',
//             data: {
//                 avatar: avatarPath
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Lỗi server khi upload avatar',
//         });
//     }
// };