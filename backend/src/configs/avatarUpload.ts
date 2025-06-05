import multer from 'multer';

const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(null, false);
        req.fileValidationError = 'Only image files are accepted';
    }
};

export const upload = multer({
    storage: multer.memoryStorage(), // Lưu vào bộ nhớ RAM
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});
