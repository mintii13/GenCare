import { StiAuditLog, IStiAuditLog } from '../models/StiAuditLog';

export class StiAuditLogRepository {
    public static async getAllAuditLogs(): Promise<IStiAuditLog | null> {
        try {
            return await StiAuditLog.find().lean<IStiAuditLog>().sort({ timestamp: -1 });
        } catch (error) {
            console.error('Error getting audit logs:', error);
            throw error;
        }
    }
    /**
 * Find audit logs with pagination and filtering
 */
    public static async findWithPagination(
        filters: any,
        page: number,
        limit: number,
        sortBy: string = 'timestamp',
        sortOrder: 1 | -1 = -1
    ): Promise<{
        auditLogs: IStiAuditLog[];
        total: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const aggregationPipeline = [
                { $match: filters },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user_details'
                    }
                },
                {
                    $addFields: {
                        user_details: { $arrayElemAt: ['$user_details', 0] }
                    }
                },
                {
                    $sort: { [sortBy]: sortOrder }
                }
            ];

            // Count total documents
            const totalCountPipeline = [
                { $match: filters },
                { $count: 'total' }
            ];

            const [auditLogs, totalCount] = await Promise.all([
                StiAuditLog.aggregate([
                    ...aggregationPipeline,
                    { $skip: skip },
                    { $limit: limit }
                ]),
                StiAuditLog.aggregate(totalCountPipeline)
            ]);

            const total = totalCount[0]?.total || 0;

            return {
                auditLogs: auditLogs as IStiAuditLog[],
                total
            };
        } catch (error) {
            console.error('Error in findWithPagination:', error);
            throw error;
        }
    }

}