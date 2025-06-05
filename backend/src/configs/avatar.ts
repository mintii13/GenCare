import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Cấu hình multer cho upload avatar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/avatars/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const userId = (req.user as any).userId;
        const extension = path.extname(file.originalname);
        cb(null, `avatar_${userId}_${Date.now()}${extension}`);
    }
});

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