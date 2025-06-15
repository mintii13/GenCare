import { Request, Response, NextFunction } from 'express';
import { StiAuditLog } from '../models/StiAuditLog';
import mongoose from 'mongoose';

export const auditLogger = async (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    const user = req.user as any;

    // Tạm thời chỉ log tạo mới Order (ví dụ: POST /createStiOrder)
    if (req.originalUrl.includes('/createStiOrder') && method === 'POST') {
        // Chờ response gửi xong rồi log
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    await StiAuditLog.create({
                        user_id: new mongoose.Types.ObjectId(user.userId),
                        action: 'Create STI Order',
                        order_id: res.locals?.createdOrderId, // bạn phải gán nó trong controller sau khi tạo
                        before: null,
                        after: req.body,
                        timestamp: new Date(),
                        notes: 'Booking new STI test'
                    });
                } catch (err) {
                    console.error('Error writing STI Audit Log:', err);
                }
            }
        });
    }

    next();
};
