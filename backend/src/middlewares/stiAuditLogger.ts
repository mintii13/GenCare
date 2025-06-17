// middlewares/autoAuditLogger.ts
import { Request, Response, NextFunction } from 'express';
import { StiAuditLog, TargetType, modelMap } from '../models/StiAuditLog';
import { GenericRepository } from '../repositories/genericRepository';

export const stiAuditLogger = (targetType: TargetType, action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user_id = (req.user as any).userId;
        const targetId = req.params.id || req.body._id;
        action = action.split(' ')[0];
        
        let before = null;
        if (action !== 'Create' && targetId) {
            before = await GenericRepository.findByTargetId(modelMap[targetType],targetId);
        }

        const oldSend = res.send;
        res.send = function (body?: any): Response {
            const result = oldSend.call(this, body);
            (async () => {
                let parsedBody: any;
                try {
                    parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
                } catch {
                    parsedBody = body;
                }
                if (parsedBody?.success === true){
                    let finalId = parsedBody?._id || targetId;
                    if (!finalId && action === 'Create') {
                        const createdRecord = await modelMap[targetType].findOne({ createdBy: user_id }).sort({ createdAt: -1 }); // cần có `timestamps: true` trong schema
                        finalId = createdRecord?._id;
                    }
                    if (!finalId) return;
                    const after = action === 'Delete' ? null: action === 'Create' ? parsedBody: await GenericRepository.findByTargetId(modelMap[targetType], finalId);
                    
                    try {
                        await StiAuditLog.create({
                            target_type: targetType,
                            target_id: finalId,
                            user_id,
                            action,
                            before,
                            after,
                            timestamp: new Date(),
                            notes: req.body.notes || '',
                        });
                    } catch (error) {
                        console.error('Failed to log audit:', error);
                        throw error;
                    }
                    
                }     
            })();
            return result;
        };
        next();
    };
}
