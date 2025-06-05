import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {User} from '../models/User'

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});

// Route upload ảnh đại diện, cập nhật URL vào DB

const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});

// export const uploadAvatar = [
//   upload.single('avatar'),
//   async (req, res) => {
//     try {
//       const userId = req.user.id;
//       const filePath = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

//       await User.findByIdAndUpdate(userId, { avatarUrl: filePath });

//       res.json({ message: 'Cập nhật ảnh thành công', avatarUrl: filePath });
//     } catch (error) {
//       res.status(500).json({ error: 'Lỗi server' });
//     }
//   }
// ];