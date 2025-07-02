import mongoose from 'mongoose';
import { PillTracking, IPillTracking } from '../models/PillTracking';

export class PillTrackingRepository {
    public static async checkNextActivePillSchedule(userId: string): Promise<boolean> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const count = await PillTracking.countDocuments({
                user_id: userId,
                pill_date: { $gte: today }
            });
            return count > 0;
        } catch (error) {
            console.error('Error checking active pill schedule:', error);
            throw error;
        }
    }

    public static async createPillSchedule(pillTrackings: Partial<IPillTracking>[]): Promise<IPillTracking[]> {
        try {
            const pills =  await PillTracking.insertMany(pillTrackings);
            return pills.map(pill => pill.toObject() as IPillTracking)
        } catch (error) {
            console.error('Error creating pill schedule:', error);
            throw error;
        }
    }

    public static async getUserPillScheduleByDate(
        userId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<IPillTracking[]> {
        try {

            const query: any = {user_id: new mongoose.Types.ObjectId(userId)};
            if (startDate && endDate) {
                query.pill_start_date = { $gte: startDate, $lte: endDate };
            } else if (startDate) {
                query.pill_start_date = { $gte: startDate };
            } else if (endDate) {
                query.pill_start_date = { $lte: endDate };
            }
            return await PillTracking.find(query).sort({ pill_start_date: 1 }).lean<IPillTracking[]>();
        } catch (error) {
            console.error('Error fetching user pill schedule:', error);
            throw error;
        }
    }


    public static async updatePillSchedule(
        user_id: string,
        updates: Partial<IPillTracking>
    ): Promise<number> {
        try {
            const userId = new mongoose.Types.ObjectId(user_id);
            const result = await PillTracking.updateMany({ user_id: userId }, { $set: updates });
            return result.modifiedCount;
        } catch (error) {
            console.error('Error updating pill schedule:', error);
            throw error;
        }
    }

    public static async deletePillSchedule(scheduleId: mongoose.Types.ObjectId): Promise<boolean> {
        try {
            const result = await PillTracking.findByIdAndDelete(scheduleId);
            return result !== null;
        } catch (error) {
            console.error('Error deleting pill schedule:', error);
            throw error;
        }
    }

    public static async findPillScheduleById(scheduleId: mongoose.Types.ObjectId): Promise<IPillTracking | null> {
        try {
            return await PillTracking.findById(scheduleId).lean();
        } catch (error) {
            console.error('Error finding pill schedule by ID:', error);
            throw error;
        }
    }

    public static async findUserActivePillSchedule(user_id: string): Promise<IPillTracking[]> {
        try {
            const userId = new mongoose.Types.ObjectId(user_id);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return await PillTracking.find({
                user_id: userId,
                pill_start_date: { $gte: today },
                is_active: true
            }).sort({ pill_start_date: 1 }).lean();
        } catch (error) {
            console.error('Error finding user active pill schedule:', error);
            throw error;
        }
    }

    public static async bulkUpdatePillSchedule(
        userId: mongoose.Types.ObjectId,
        updates: Partial<IPillTracking>[]
    ): Promise<boolean> {
        try {
            const bulkOps = updates.map(update => ({
                updateOne: {
                    filter: {
                        user_id: userId,
                        pill_date: update.pill_start_date
                    },
                    update: { $set: update },
                    upsert: false
                }
            }));
            const result = await PillTracking.bulkWrite(bulkOps);
            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error bulk updating pill schedule:', error);
            throw error;
        }
    }

    public static async deleteUserPillSchedule(userId: mongoose.Types.ObjectId): Promise<number> {
        try {
            const result = await PillTracking.deleteMany({ user_id: userId });
            return result.deletedCount;
        } catch (error) {
            console.error('Error deleting user pill schedule:', error);
            throw error;
        }
    }

    public static async deactivateAllSchedules(user_id: string): Promise<void> {
        try {
            const userId = new mongoose.Types.ObjectId(user_id);
            await PillTracking.updateMany(
                { user_id: userId, is_active: true },
                { $set: { is_active: false } }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
