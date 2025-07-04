import mongoose from 'mongoose';
import { IMenstrualCycle, MenstrualCycle} from '../models/MenstrualCycle';
import { CycleStatsData, PeriodStatsData } from '../dto/requests/menstrualCycleRequest';

export class MenstrualCycleRepository {
    public static async deleteCyclesByUser(user_id: string) {
        try {
            return await MenstrualCycle.deleteMany({ user_id });
        } catch (error) {
            console.error('Error deleting menstrual cycles:', error);
            throw error;
        }
    }

    public static async insertCycles(cycles: IMenstrualCycle[]) {
        try {
            return await MenstrualCycle.insertMany(cycles);
        } catch (error) {
            console.error('Error inserting menstrual cycles:', error);
            throw error;
        }
    }

    public static async getCyclesByUser(user_id: string) {
        try {
            return await MenstrualCycle.find({ user_id })
                .sort({ cycle_start_date: -1 });
        } catch (error) {
            console.error('Error getting cycles by user:', error);
            throw error;
        }
    }

    public static async getCyclesByMonth(user_id: string, year: number, month: number) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            
            return await MenstrualCycle.find({
                user_id,
                cycle_start_date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ cycle_start_date: -1 });
        } catch (error) {
            console.error('Error getting cycles by month:', error);
            throw error;
        }
    }

    public static async getLatestCycles(user_id: string, limit: number = 3) {
        try {
            return await MenstrualCycle.find({ user_id })
                .sort({ cycle_start_date: -1 })
                .limit(limit);
        } catch (error) {
            console.error('Error getting latest cycles:', error);
            throw error;
        }
    }

    public static async updateNotificationByUserId(user_id: string, settings: any) {
        try {
            return await MenstrualCycle.updateMany( 
                { user_id }, 
                { notification_enabled: settings.notification_enabled, notification_types: settings.notification_types } 
            ); 
        } catch (error) {
            console.error('Error getting latest cycles:', error);
            throw error;
        }
    }

    public static async getCycleStatsData(user_id: string, months: number): Promise<CycleStatsData[]> {
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - months);

        const cycles = await MenstrualCycle.find({
            user_id: new mongoose.Types.ObjectId(user_id),
            cycle_start_date: { $gte: monthsAgo },
            cycle_length: { $exists: true, $gt: 0 }
        })
        .select('cycle_start_date cycle_length period_days createdAt')
        .sort({ cycle_start_date: -1 })
        .lean();

        const mapped: CycleStatsData[] = cycles.map(cycle => ({
            _id: cycle._id.toString(),
            cycle_start_date: cycle.cycle_start_date,
            cycle_length: cycle.cycle_length,
            period_days: cycle.period_days.length,
            createdAt: cycle.createdAt
        }));
        return mapped;
    }

    // Lấy dữ liệu kinh nguyệt cho thống kê
    public static async getPeriodStatsData(user_id: string, months: number): Promise<PeriodStatsData[]> {
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - months);

        const periods = await MenstrualCycle.find({
            user_id: new mongoose.Types.ObjectId(user_id),
            cycle_start_date: { $gte: monthsAgo },
            period_days: { $exists: true, $gt: 0 }
        })
        .select('cycle_start_date period_days notes createdAt')
        .sort({ cycle_start_date: -1 })
        .lean();

        const mapped: PeriodStatsData[] = periods.map(p => ({
            _id: p._id.toString(),
            cycle_start_date: p.cycle_start_date,
            period_days: p.period_days.length,
            createdAt: p.createdAt
        }));
        return mapped;
    }

    // Lấy chu kỳ gần nhất để tính xu hướng
    public static async getRecentCycles(user_id: string, limit: number): Promise<CycleStatsData[]> {
        const cycles = await MenstrualCycle.find({
            user_id: new mongoose.Types.ObjectId(user_id),
            cycle_length: { $exists: true, $gt: 0 }
        })
        .select('cycle_start_date cycle_length period_days createdAt')
        .sort({ cycle_start_date: -1 })
        .limit(limit)
        .lean();

        const mapped: CycleStatsData[] = cycles.map(cycle => ({
            _id: cycle._id.toString(),
            cycle_start_date: cycle.cycle_start_date,
            cycle_length: cycle.cycle_length,
            period_days: Array.isArray(cycle.period_days) ? cycle.period_days.length : cycle.period_days,
            createdAt: cycle.createdAt
        }));
        return mapped;
    }

    // Đếm tổng số chu kỳ đã theo dõi
    public static async getTotalCyclesCount(user_id: string): Promise<number> {
        return await MenstrualCycle.countDocuments({
            user_id: new mongoose.Types.ObjectId(user_id),
            cycle_length: { $exists: true, $gt: 0 }
        });
    }

    // Lấy ngày bắt đầu theo dõi đầu tiên
    public static async getFirstTrackingDate(user_id: string): Promise<Date | null> {
        const firstCycle = await MenstrualCycle.findOne({
            user_id: new mongoose.Types.ObjectId(user_id)
        })
        .select('cycle_start_date')
        .sort({ cycle_start_date: 1 })
        .lean();

        return firstCycle?.cycle_start_date || null;
    }

    public static async updateCycle(cycleId: string, updateData: Partial<IMenstrualCycle>) {
        try {
            return await MenstrualCycle.findByIdAndUpdate(
                cycleId, 
                { ...updateData, updatedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            console.error('Error updating cycle:', error);
            throw error;
        }
    }
}