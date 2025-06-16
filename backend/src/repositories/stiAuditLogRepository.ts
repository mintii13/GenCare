import { StiAuditLog, IStiAuditLog } from '../models/StiAuditLog';

export class StiAuditLogRepository{
    public static async getAllAuditLogs(): Promise<IStiAuditLog | null> {
        try {
            return await StiAuditLog.find().lean<IStiAuditLog>().sort({ timestamp: -1 });
        } catch (error) {
            console.error('Error getting audit logs:', error);
            throw error;
        }
    }

}