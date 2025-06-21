// middlewares/autoAuditLogger.ts
import { Request, Response, NextFunction } from 'express';
import { StiAuditLog, TargetType } from '../models/StiAuditLog';
import mongoose from 'mongoose';
import { GenericRepository } from '../repositories/genericRepository';

export const autoAuditLogger = (targetType: TargetType, model: mongoose.Model<any>, action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as any;
        const targetId = req.params.id || req.body._id;

        let before = null;
        if (action !== 'Create' && targetId) {
            before = await GenericRepository.findByTargetId(model, targetId);
        }

        const oldSend = res.send;
        res.send = async function (body?: any): Promise<Response> {
        let parsedBody: any;
        try {
            parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        } catch {
            parsedBody = body;
        }

        const finalId = parsedBody?._id || parsedBody?.id || targetId;

        const after = action === 'Delete' ? null: action === 'Create' ? parsedBody: await model.findById(finalId).lean();

        await StiAuditLog.create({
            target_type: targetType,
            target_id: finalId,
            user_id: user?._id,
            action,
            before,
            after,
            timestamp: new Date(),
            notes: req.body.notes || '',
        });

        return oldSend.call(this, body);
        } as any;

        next();
    };
};