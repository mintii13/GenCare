import { IMenstrualCycle, MenstrualCycle} from '../models/MenstrualCycle';

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
}