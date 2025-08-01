import mongoose from 'mongoose';
import { PillTracking, IPillTracking } from '../models/PillTracking';
import {DateTime} from 'luxon';
import { TimeUtils } from '../utils/timeUtils';
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
            console.log('[PillTrackingRepository] Deleting pill schedules for user:', userId.toString());
            
            // First, count how many records exist
            const countBefore = await PillTracking.countDocuments({ user_id: userId });
            console.log('[PillTrackingRepository] Found', countBefore, 'pill schedules to delete');
            
            const result = await PillTracking.deleteMany({ user_id: userId });
            console.log('[PillTrackingRepository] Deleted', result.deletedCount, 'pill schedules');
            
            // Verify deletion
            const countAfter = await PillTracking.countDocuments({ user_id: userId });
            console.log('[PillTrackingRepository] Remaining pill schedules after deletion:', countAfter);
            
            return result.deletedCount;
        } catch (error) {
            console.error('[PillTrackingRepository] Error deleting user pill schedule:', error);
            throw error;
        }
    }

    public static async deletePillScheduleByCycle(cycleId: string): Promise<number> {
        try {
            console.log('[PillTrackingRepository] Deleting pill schedules for cycle:', cycleId);
            
            // First, count how many records exist
            const countBefore = await PillTracking.countDocuments({ 
                menstrual_cycle_id: new mongoose.Types.ObjectId(cycleId) 
            });
            console.log('[PillTrackingRepository] Found', countBefore, 'pill schedules to delete for cycle');
            
            const result = await PillTracking.deleteMany({ 
                menstrual_cycle_id: new mongoose.Types.ObjectId(cycleId) 
            });
            console.log('[PillTrackingRepository] Deleted', result.deletedCount, 'pill schedules for cycle');
            
            return result.deletedCount;
        } catch (error) {
            console.error('[PillTrackingRepository] Error deleting pill schedule by cycle:', error);
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

    public static async findReminderPill(): Promise<IPillTracking[]> {
        const now = TimeUtils.getCurrentDateTimeInZone();
        const todayEnd = now.endOf('day').toJSDate();
        console.log('[PillTrackingRepository] findReminderPill - Current time:', now.toFormat('HH:mm'), 'Today end:', todayEnd);
        
        const result = await PillTracking.find({
            is_taken: false,
            reminder_enabled: true,
            pill_start_date: { $lte: todayEnd },
        }).sort({ pill_start_date: -1 }).exec();
        
        console.log('[PillTrackingRepository] findReminderPill - Found', result.length, 'schedules');
        
        const latestByUser = new Map<string, IPillTracking>();
        for (const schedule of result) {
            const userId = schedule.user_id.toString();
            if (!latestByUser.has(userId)) {
                latestByUser.set(userId, schedule);
            }
        }

        const finalResult = [...latestByUser.values()];
        console.log('[PillTrackingRepository] findReminderPill - Returning', finalResult.length, 'unique users');
        
        return finalResult;
    }

    public static async hasTrackingForCycle(cycleId: string): Promise<boolean>{
        try {
            console.log('[PillTrackingRepository] Checking for existing pill tracking with cycleId:', cycleId);
            const existing = await PillTracking.findOne({
                menstrual_cycle_id: new mongoose.Types.ObjectId(cycleId)
            }).lean();
            console.log('[PillTrackingRepository] Found existing pill tracking:', !!existing);
            return !!existing;
        } catch (error) {
            console.error('[PillTrackingRepository] Error checking existing pill tracking:', error);
            throw error;
        }
    }

    public static async getMenstrualCycleByUser(userId: string): Promise<any> {
        try {
            const activeCycle = await PillTracking.findOne({
                user_id: new mongoose.Types.ObjectId(userId),
            }).populate('menstrual_cycle_id').lean();
            
            return activeCycle ? activeCycle.menstrual_cycle_id : null;
        } catch (error) {
            console.error('Error checking active menstrual cycle:', error);
            throw error;
        }
    }

    public static async getLastTakenPill(userId: string): Promise<IPillTracking | null> {
        try {
            const userId_obj = new mongoose.Types.ObjectId(userId);
            return await PillTracking.findOne({
                user_id: userId_obj,
                is_taken: true,
                is_active: true
            }).sort({ pill_number: -1 }).lean();
        } catch (error) {
            console.error('Error getting last taken pill:', error);
            throw error;
        }
    }

    public static async getPillSchedulesByCycle(userId: string, cycleId: string): Promise<IPillTracking[]> {
        try {
            const userId_obj = new mongoose.Types.ObjectId(userId);
            const cycleId_obj = new mongoose.Types.ObjectId(cycleId);
            
            return await PillTracking.find({
                user_id: userId_obj,
                menstrual_cycle_id: cycleId_obj,
                is_active: true
            }).sort({ pill_number: 1 }).lean();
        } catch (error) {
            console.error('Error getting pill schedules by cycle:', error);
            throw error;
        }
    }

    public static async updatePillType(userId: string, newPillType: string): Promise<number> {
        try {
            const userId_obj = new mongoose.Types.ObjectId(userId);
            const result = await PillTracking.updateMany(
                { 
                    user_id: userId_obj, 
                    is_active: true 
                }, 
                { 
                    $set: { pill_type: newPillType } 
                }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error('Error updating pill type:', error);
            throw error;
        }
    }

    public static async deactivatePillsAfterDay(userId: string, dayNumber: number): Promise<number> {
        try {
            const userId_obj = new mongoose.Types.ObjectId(userId);
            const result = await PillTracking.updateMany(
                { 
                    user_id: userId_obj, 
                    pill_number: { $gt: dayNumber },
                    is_active: true
                }, 
                { 
                    $set: { is_active: false } 
                }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error('Error deactivating pills after day:', error);
            throw error;
        }
    }

    public static async updatePillsToPlacebo(userId: string, startDay: number, endDay: number): Promise<number> {
        try {
            const userId_obj = new mongoose.Types.ObjectId(userId);
            const result = await PillTracking.updateMany(
                { 
                    user_id: userId_obj, 
                    pill_number: { $gte: startDay, $lte: endDay },
                    is_active: true
                }, 
                { 
                    $set: { pill_status: 'placebo' } 
                }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error('Error updating pills to placebo:', error);
            throw error;
        }
    }

    public static async updateSpecificPillSchedule(
        userId: string, 
        pillNumber: number, 
        updates: Partial<IPillTracking>
    ): Promise<number> {
        try {
            const userId_obj = new mongoose.Types.ObjectId(userId);
            const result = await PillTracking.updateOne(
                { 
                    user_id: userId_obj, 
                    pill_number: pillNumber,
                    is_active: true
                }, 
                { 
                    $set: updates 
                }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error('Error updating specific pill schedule:', error);
            throw error;
        }
    }

    public static async getPillsByDateRange(
        userId: string, 
        startDate: Date, 
        endDate: Date
    ): Promise<IPillTracking[]> {
        try {
            const userId_obj = new mongoose.Types.ObjectId(userId);
            return await PillTracking.find({
                user_id: userId_obj,
                pill_start_date: { $gte: startDate, $lte: endDate },
                is_active: true
            }).sort({ pill_start_date: 1 }).lean();
        } catch (error) {
            console.error('Error getting pills by date range:', error);
            throw error;
        }
    }

    public static async deletePillsAfterDay(userId: string, dayNumber: number): Promise<number> {
        try {
            const userId_obj = new mongoose.Types.ObjectId(userId);
            const result = await PillTracking.deleteMany({
                user_id: userId_obj,
                pill_number: { $gt: dayNumber },
                is_active: true
            });
            return result.deletedCount;
        } catch (error) {
            console.error('Error deleting pills after day:', error);
            throw error;
        }
    }

    public static async getPillTrackingByDateRange(user_id: string, start: Date, end: Date){
        try {
            const userId = new mongoose.Types.ObjectId(user_id);
            console.log(start, end);
            const result = await PillTracking.find({
                user_id: userId,
                pill_start_date: { $gte: start, $lte: end },
            }).select('_id is_taken pill_start_date').sort({ pill_start_date: 1 });
            return result.map(item => ({
                _id: item._id,
                is_taken: item.is_taken,
                pill_start_date: new Date(item.pill_start_date).toISOString().slice(0, 10)
            }))
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async updateTakenStatus(pill_tracking_id: string){
        try {
            const pillTrackingId = new mongoose.Types.ObjectId(pill_tracking_id)
            return await PillTracking.findByIdAndUpdate(
                pillTrackingId,
                { is_taken: true },
                { new: true }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getPillTrackingByUserId(user_id: string){
        try {
            const userId = new mongoose.Types.ObjectId(user_id);
            return await PillTracking.find({ user_id: userId, is_active: true });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
