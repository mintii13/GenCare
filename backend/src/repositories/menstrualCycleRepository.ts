import mongoose from 'mongoose';
import { IMenstrualCycle, MenstrualCycle } from '../models/MenstrualCycle';
import { toVietnamDate, getVietnamDateRange, toVietnamEndOfDay } from '../utils/dateUtils';

// Define interfaces for backward compatibility
interface CycleStatsData {
    _id: string;
    cycle_start_date: Date;
    cycle_length: number;
    period_days: number;
    createdAt: Date;
}

interface PeriodStatsData {
    _id: string;
    cycle_start_date: Date;
    period_days: number;
    createdAt: Date;
}

export class MenstrualCycleRepository {
    public static async deleteCyclesByUser(user_id: string) {
        try {
            return await MenstrualCycle.deleteMany({ user_id });
        } catch (error) {
            console.error('Error deleting menstrual cycles:', error);
            throw error;
        }
    }

    public static async cleanupDuplicateCycles(user_id: string) {
        try {
            console.log('[Repository] Cleaning up duplicate cycles for user:', user_id);
            
            // Find all cycles for this user
            const allCycles = await MenstrualCycle.find({ user_id }).sort({ createdAt: -1 });
            console.log('[Repository] Found cycles:', allCycles.length);
            
            if (allCycles.length <= 1) {
                console.log('[Repository] No duplicates to clean up');
                return;
            }
            
            // Group cycles by cycle_start_date
            const cyclesByDate = new Map();
            allCycles.forEach(cycle => {
                const dateKey = cycle.cycle_start_date.toISOString().split('T')[0];
                if (!cyclesByDate.has(dateKey)) {
                    cyclesByDate.set(dateKey, []);
                }
                cyclesByDate.get(dateKey).push(cycle);
            });
            
            // Delete duplicates, keep the most recent one
            for (const [dateKey, cycles] of cyclesByDate) {
                if (cycles.length > 1) {
                    console.log('[Repository] Found duplicates for date:', dateKey, 'count:', cycles.length);
                    // Keep the first one (most recent due to sort), delete the rest
                    const toDelete = cycles.slice(1);
                    const deleteIds = toDelete.map(c => c._id);
                    console.log('[Repository] Deleting cycles:', deleteIds);
                    
                    const deleteResult = await MenstrualCycle.deleteMany({ _id: { $in: deleteIds } });
                    console.log('[Repository] Deleted cycles:', deleteResult.deletedCount);
                }
            }
        } catch (error) {
            console.error('Error cleaning up duplicate cycles:', error);
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

    public static async create(cycleData: Partial<IMenstrualCycle>) {
        try {
            console.log('[MenstrualCycleRepository] Creating cycle with data:', JSON.stringify(cycleData, null, 2));
            const cycle = new MenstrualCycle(cycleData);
            const savedCycle = await cycle.save();
            console.log('[MenstrualCycleRepository] Successfully saved cycle:', savedCycle._id);
            return savedCycle;
        } catch (error) {
            console.error('Error creating menstrual cycle:', error);
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

    public static async findByUser(user_id: string) {
        try {
            console.log('[Repository] findByUser called with user_id:', user_id);
            console.log('[Repository] user_id type:', typeof user_id);
            
            // Try both string and ObjectId formats
            let cycles = await MenstrualCycle.find({ user_id })
                .sort({ cycle_start_date: -1 });
                
            if (!cycles || cycles.length === 0) {
                console.log('[Repository] No cycles found with string user_id, trying ObjectId...');
                try {
                    const objectId = new mongoose.Types.ObjectId(user_id);
                    cycles = await MenstrualCycle.find({ user_id: objectId })
                        .sort({ cycle_start_date: -1 });
                    console.log('[Repository] ObjectId search result:', cycles?.length || 0);
                } catch (objectIdError) {
                    console.log('[Repository] ObjectId conversion failed:', objectIdError.message);
                }
            }
            
            console.log('[Repository] findByUser final result:', {
                cyclesFound: cycles?.length || 0,
                cycles: cycles?.map(c => ({
                    _id: c._id,
                    user_id: c.user_id,
                    cycle_start_date: c.cycle_start_date,
                    period_days_count: c.period_days?.length || 0
                }))
            });
            return cycles;
        } catch (error) {
            console.error('Error finding cycles by user:', error);
            throw error;
        }
    }

    public static async findByDateAndUser(user_id: string, date: Date) {
        try {
            // Find cycle that contains the given date in its period_days
            return await MenstrualCycle.findOne({
                user_id,
                period_days: {
                    $elemMatch: {
                        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                    }
                }
            });
        } catch (error) {
            console.error('Error finding cycle by date and user:', error);
            throw error;
        }
    }

    public static async findByDateRangeAndUser(user_id: string, startDate: Date, endDate: Date) {
        try {
            return await MenstrualCycle.find({
                user_id,
                $or: [
                    {
                        cycle_start_date: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    },
                    {
                        period_days: {
                            $elemMatch: {
                                $gte: startDate,
                                $lte: endDate
                            }
                        }
                    }
                ]
            }).sort({ cycle_start_date: -1 });
        } catch (error) {
            console.error('Error finding cycles by date range and user:', error);
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

        const cycles = await MenstrualCycle.find({
            user_id: new mongoose.Types.ObjectId(user_id),
            cycle_start_date: { $gte: monthsAgo }
        })
        .select('cycle_start_date period_days createdAt')
        .sort({ cycle_start_date: -1 })
        .lean();

        const mapped: PeriodStatsData[] = cycles.map(cycle => ({
            _id: cycle._id.toString(),
            cycle_start_date: cycle.cycle_start_date,
            period_days: cycle.period_days.length,
            createdAt: cycle.createdAt
        }));
        return mapped;
    }

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
            period_days: cycle.period_days.length,
            createdAt: cycle.createdAt
        }));
        return mapped;
    }

    public static async getTotalCyclesCount(user_id: string): Promise<number> {
        return await MenstrualCycle.countDocuments({
            user_id: new mongoose.Types.ObjectId(user_id),
            cycle_length: { $exists: true, $gt: 0 }
        });
    }

    public static async getFirstTrackingDate(user_id: string): Promise<Date | null> {
        const firstCycle = await MenstrualCycle.findOne({
            user_id: new mongoose.Types.ObjectId(user_id)
        })
        .select('cycle_start_date')
        .sort({ cycle_start_date: 1 })
        .lean();

        return firstCycle ? firstCycle.cycle_start_date : null;
    }

    public static async updateCycle(cycleId: string, updateData: Partial<IMenstrualCycle>) {
        try {
            return await MenstrualCycle.findByIdAndUpdate(
                cycleId,
                updateData,
                { new: true }
            );
        } catch (error) {
            console.error('Error updating cycle:', error);
            throw error;
        }
    }

    public static async findById(cycleId: string) {
        try {
            return await MenstrualCycle.findById(cycleId);
        } catch (error) {
            console.error('Error finding cycle by ID:', error);
            throw error;
        }
    }




}