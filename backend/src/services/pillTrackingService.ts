import { GetScheduleRequest, SetupPillTrackingRequest, UpdateScheduleRequest } from '../dto/requests/PillTrackingRequest';
import { PillScheduleResponse } from "../dto/responses/PillTrackingResponse";
import { IPillTracking, PillTypes } from "../models/PillTracking";
import { PillTrackingRepository } from "../repositories/pillTrackingRepository";
import mongoose from 'mongoose';
import { MailUtils } from "../utils/mailUtils";
import { UserRepository } from "../repositories/userRepository";
import * as cron from 'node-cron'
import { DateTime } from 'luxon';
import { MenstrualCycleRepository } from '../repositories/menstrualCycleRepository';
export class PillTrackingService{
    private static getConfigPillTypes(pillType: PillTypes): { totalDays: number; hormoneDays: number } {
        switch (pillType) {
            case '21-day':
                return { totalDays: 21, hormoneDays: 21 };
            case '24+4':
                return { totalDays: 28, hormoneDays: 24 };
            case '21+7':
                return { totalDays: 28, hormoneDays: 21 };
            default:
                throw new Error('This pill type is unsupported.');
        }
    }
    
    private static calculatePillSchedule(pillTracking: SetupPillTrackingRequest, menstrualCycleId: string): Partial<IPillTracking>[] {
        const schedules: Partial<IPillTracking>[] = [];
        const { userId, pill_type, pill_start_date, reminder_time, reminder_enabled, max_reminder_times, reminder_interval } = pillTracking;
        const config = this.getConfigPillTypes(pill_type);
        
        for (let day = 0; day < config.totalDays; day++) {
            const start_date = new Date(pill_start_date);
            start_date.setDate(start_date.getDate() + day);

            const pillNumber = 1 + day;
            const isHormonePill = day < config.hormoneDays;

            schedules.push({
                user_id: new mongoose.Types.ObjectId(userId),
                menstrual_cycle_id: new mongoose.Types.ObjectId(menstrualCycleId),
                pill_start_date: start_date,
                is_taken: false,
                pill_number: pillNumber,
                pill_type: pill_type,
                pill_status: isHormonePill ? 'hormone' : 'placebo',
                reminder_enabled: reminder_enabled,
                reminder_time: reminder_time,
                max_reminder_times: reminder_enabled ? max_reminder_times ?? 1 : undefined,
                reminder_interval: reminder_enabled ? reminder_interval ?? 15 : undefined,
                reminder_sent_timestamps: []
            });
        }
        return schedules;
    }

    public static async setupPillTracking(pillTracking: SetupPillTrackingRequest) {
        try {
            const { userId, pill_type, pill_start_date, reminder_time, reminder_enabled, max_reminder_times, reminder_interval} = pillTracking;
            console.log("info: ", userId, pill_type, pill_start_date, reminder_time, reminder_enabled, max_reminder_times, reminder_interval);
            const TIMEZONE = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';
            if (!userId || !pill_type || !pill_start_date || !reminder_time) {
                return {
                    success: false,
                    message: 'Missing required fields'
                };
            }

            // pill type only: 21-day, 24+4, 21+7
            if (!['21-day', '24+4', '21+7'].includes(pill_type)) {
                return {
                    success: false,
                    message: 'Invalid pillType. Must be 21-day, 24+4, or 21+7'
                };
            }

            // Parse and validate startDate
            const parsedStartDate = DateTime.fromISO(pill_start_date, { zone: TIMEZONE})
            if (!parsedStartDate.isValid) {
                return {
                    success: false,
                    message: 'Invalid startDate format'
                };
            }

            // Kiểm tra menstrual cycle còn active
            const menstrualCycle = await MenstrualCycleRepository.getLatestCycles(userId, 1);
            if (!menstrualCycle || menstrualCycle.length === 0) {
                return {
                    success: false,
                    message: 'No active menstrual cycle found. Please create menstrual cycle first.'
                };
            }
            // const cycleStartDate = DateTime.fromJSDate(menstrualCycle[0].cycle_start_date).startOf('day');
            // const diffDays = Math.floor(parsedStartDate.diff(cycleStartDate, 'days').days);
            // if (diffDays < 0 || diffDays >= 5){
            //     return{
            //         success: false,
            //         message: 'You cannot drink pill after menstrual cycle date over 5 five days'
            //     }
            // }
            // Kiểm tra đã có pill tracking cho menstrual cycle này chưa
            const existingPillTracking = await PillTrackingRepository.hasTrackingForCycle(menstrualCycle[0]._id.toString())
            if (existingPillTracking) {
                return {
                    success: false,
                    message: 'Pill tracking already exists for current menstrual cycle.'
                };
            }

            const pillSchedules = this.calculatePillSchedule(
                pillTracking, 
                menstrualCycle[0]._id.toString()
            );
            const result = await PillTrackingRepository.createPillSchedule(pillSchedules);
            
            if (!result) {
                return {
                    success: false,
                    message: 'Failed to create pill tracking'
                };
            }
            return {
                success: true,
                message: 'Pill tracking schedule created successfully',
                data: result,
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'System error in setup pill tracking'
            };
        }
    }

    public static async getUserPillSchedule(pillSchedule: GetScheduleRequest): Promise<PillScheduleResponse>{
        try {
            // Validate input
            const {userId, startDate, endDate} = pillSchedule
            if (!userId) {
                return {
                    success: false,
                    message: 'Cannot find user id',
                };
            }
            let parseStartDate: Date | undefined;
            let parseEndDate: Date | undefined;

            // Validate optional date parameters
            if (startDate) {
                const date = new Date(startDate);
                if (isNaN(date.getTime())) {
                    return {
                        success: false,
                        message: 'Invalid startDate format',
                    };
                }
                parseStartDate = date;
            }

            if (endDate) {
                const date = new Date(endDate);
                if (isNaN(date.getTime())) {
                    return {
                        success: false,
                        message: 'Invalid startDate format',
                    };
                }
                parseEndDate = date;
            }
            const schedules = await PillTrackingRepository.getUserPillScheduleByDate(
                userId,
                parseStartDate,
                parseEndDate
            );

            if (!schedules || schedules.length === 0) {
                return {
                    success: false,
                    message: 'No pill tracking schedule found for this user',
                };
            }

            return {
                success: true,
                message: 'Pill schedule retrieved successfully',
                data: schedules,
            };

        } catch (error) {
            return {
                success: false,
                message: `Error retrieving pill schedule: ${error}`,
            };
        }
    }

    public static async updatePillSchedule(pillSchedule: UpdateScheduleRequest): Promise<PillScheduleResponse> {
        try {
            const userId = pillSchedule.user_id;
            
            const existingSchedules = await PillTrackingRepository.findUserActivePillSchedule(userId);
            if (existingSchedules.length === 0) {
                return {
                    success: false,
                    message: 'No active pill schedule found for this user',
                };
            }

            const currentSchedule = existingSchedules[0];

            // change pill_type logic
            if (pillSchedule.pill_type && pillSchedule.pill_type !== currentSchedule.pill_type) {
                const switchResult = await this.handlePillTypeSwitch(
                    userId,
                    currentSchedule.pill_type,
                    pillSchedule.pill_type,
                    pillSchedule,
                    currentSchedule
                );

                if (!switchResult.success) {
                    return switchResult;
                }

                return {
                    success: true,
                    message: 'Pill type changed successfully',
                };
            }

            // Other updated field (not pill type)
            const updateFields: Partial<any> = {};

            if (pillSchedule.is_taken !== undefined) {
                updateFields.is_taken = pillSchedule.is_taken;
                updateFields.taken_time = new Date();
            }
            if (pillSchedule.is_active !== undefined) 
                updateFields.is_active = pillSchedule.is_active;
            if (pillSchedule.reminder_enabled !== undefined) 
                updateFields.reminder_enabled = pillSchedule.reminder_enabled;
            if (pillSchedule.reminder_time) 
                updateFields.reminder_time = pillSchedule.reminder_time;
            if (pillSchedule.max_reminder_times !== undefined)
                updateFields.max_reminder_times = pillSchedule.max_reminder_times;
            if (pillSchedule.reminder_interval !== undefined)
                updateFields.reminder_interval = pillSchedule.reminder_interval;

            // Reset reminder timestamps if change the reminder fields
            if (
                (pillSchedule.reminder_enabled === true && currentSchedule.reminder_enabled === false) ||
                (pillSchedule.reminder_time !== undefined && pillSchedule.reminder_time !== currentSchedule.reminder_time) ||
                (pillSchedule.max_reminder_times !== undefined && pillSchedule.max_reminder_times !== currentSchedule.max_reminder_times)
            ) {
                if (Array.isArray(currentSchedule.reminder_sent_timestamps)) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Đầu ngày hôm nay
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1); // Đầu ngày mai

                    updateFields.reminder_sent_timestamps = currentSchedule.reminder_sent_timestamps.filter((ts: Date | string) => {
                        const date = new Date(ts);
                        return !(date >= today && date < tomorrow); // Giữ lại những timestamp KHÔNG thuộc hôm nay
                    });
                }
            }

            const result = await PillTrackingRepository.updatePillSchedule(userId, updateFields);
            if (result === 0) {
                return {
                    success: false,
                    message: "Nothing to update or update failed"
                };
            }

            return {
                success: true,
                message: 'Pill schedule updated successfully',
            };
        } catch (error) {
            return {
                success: false,
                message: `Error updating pill schedule: ${error}`,
            };
        }
    }

    private static async handlePillTypeSwitch(
        userId: string,
        fromPillType: PillTypes,
        toPillType: PillTypes,
        pillSchedule: UpdateScheduleRequest,
        currentSchedule: any
    ): Promise<PillScheduleResponse> {
        try {
            // Kiểm tra menstrual cycle gần nhất
            const recentMenstrualCycle = await PillTrackingRepository.getMenstrualCycleByUser(userId);
            if (!recentMenstrualCycle) {
                return {
                    success: false,
                    message: 'No active menstrual cycle found for pill type change'
                };
            }

            // Get all current schedules for this cycle
            const allCurrentSchedules = await PillTrackingRepository.getPillSchedulesByCycle(
                userId, 
                recentMenstrualCycle._id.toString()
            );

            const firstPillDate = new Date(allCurrentSchedules[0].pill_start_date);
            const today = new Date();
            firstPillDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - firstPillDate.getTime()) / (1000 * 60 * 60 * 24));
            const currentPillNumber = diffDays + 1;

            switch (`${fromPillType}->${toPillType}`) {
                case '21-day->21+7':
                    return await this.switch21DayTo21Plus7(
                        userId, 
                        currentPillNumber, 
                        allCurrentSchedules,
                        pillSchedule,
                        currentSchedule,
                        recentMenstrualCycle._id.toString()
                    );

                case '21-day->24+4':
                    return await this.switch21DayTo24Plus4(
                        userId, 
                        currentPillNumber, 
                        allCurrentSchedules,
                        pillSchedule,
                        currentSchedule,
                        recentMenstrualCycle._id.toString()
                    );

                case '24+4->21-day':
                    return await this.switch24Plus4To21Day(userId, currentPillNumber);

                case '24+4->21+7':
                    return await this.switch24Plus4To21Plus7(userId, currentPillNumber);

                case '21+7->21-day':
                    return await this.switch21Plus7To21Day(userId);

                case '21+7->24+4':
                    return {
                        success: false,
                        message: 'Cannot change from 21+7 to 24+4 pill type'
                    };

                default:
                    return {
                        success: false,
                        message: 'Invalid pill type change'
                    };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error handling pill type switch: ${error}`
            };
        }
    }

    private static async switch21DayTo21Plus7(
        userId: string,
        currentPillNumber: number,
        allCurrentSchedules: any[],
        pillSchedule: UpdateScheduleRequest,
        currentSchedule: any,
        menstrualCycleId: string
    ): Promise<PillScheduleResponse> {
        try {
            // 1. Cập nhật loại thuốc hiện tại sang '21+7'
            const result = await PillTrackingRepository.updatePillType(userId, '21+7');
            if (!result) {
                return {
                    success: false,
                    message: 'Failed to update pill type'
                };
            }

            const firstPillDate = new Date(allCurrentSchedules[0].pill_start_date);
            firstPillDate.setHours(0, 0, 0, 0);

            // 3. Tạo các viên placebo từ ngày 22–28 nếu chưa đến ngày đó
            const additionalSchedules = [];

            for (let day = 22; day <= 28; day++) {
                if (day <= currentPillNumber) 
                    continue;

                const pillDate = new Date(firstPillDate);
                pillDate.setDate(pillDate.getDate() + (day - 1));

                additionalSchedules.push({
                    user_id: new mongoose.Types.ObjectId(userId),
                    menstrual_cycle_id: new mongoose.Types.ObjectId(menstrualCycleId),
                    pill_start_date: pillDate,
                    is_taken: false,
                    pill_number: day,
                    pill_type: '21+7',
                    pill_status: 'placebo',
                    reminder_enabled: pillSchedule.reminder_enabled ?? currentSchedule.reminder_enabled,
                    reminder_time: pillSchedule.reminder_time ?? currentSchedule.reminder_time,
                    max_reminder_times: pillSchedule.max_reminder_times ?? currentSchedule.max_reminder_times,
                    reminder_interval: pillSchedule.reminder_interval ?? currentSchedule.reminder_interval,
                    reminder_sent_timestamps: []
                });
            }

            if (additionalSchedules.length > 0) {
                const result = await PillTrackingRepository.createPillSchedule(additionalSchedules);
                if (!result){
                    return { 
                        success: false, 
                        message: 'Failed to update from 21-day to 21+7' 
                    };
                }
                return {
                    success: true,
                    message: 'Successfully updated from 21-day to 21+7'
                };
            }
            else{
                return {
                    success: false,
                    message: 'Nothing to update'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                message: `Error switching pill type: ${error}`
            };
        }
    }

    private static async switch21DayTo24Plus4(
        userId: string,
        currentPillNumber: number,
        allCurrentSchedules: any[],
        pillSchedule: UpdateScheduleRequest,
        currentSchedule: any,
        menstrualCycleId: string
    ): Promise<PillScheduleResponse> {
        try {         
            if (currentPillNumber === 21) {
                // Ngày 21, tạo thêm 3 viên hormone (22-24) và 4 viên placebo (25-28)
                const additionalSchedules = [];
                const lastSchedule = allCurrentSchedules[allCurrentSchedules.length - 1];
                
                for (let day = 22; day <= 28; day++) {
                    const pillDate = new Date(lastSchedule.pill_start_date);
                    pillDate.setDate(pillDate.getDate() + (day - lastSchedule.pill_number));

                    additionalSchedules.push({
                        user_id: new mongoose.Types.ObjectId(userId),
                        menstrual_cycle_id: new mongoose.Types.ObjectId(menstrualCycleId),
                        pill_start_date: pillDate,
                        is_taken: false,
                        pill_number: day,
                        pill_type: '24+4',
                        pill_status: day <= 24 ? 'hormone' : 'placebo',
                        reminder_enabled: pillSchedule.reminder_enabled ?? currentSchedule.reminder_enabled,
                        reminder_time: pillSchedule.reminder_time ?? currentSchedule.reminder_time,
                        max_reminder_times: pillSchedule.max_reminder_times ?? currentSchedule.max_reminder_times,
                        reminder_interval: pillSchedule.reminder_interval ?? currentSchedule.reminder_interval,
                        reminder_sent_timestamps: []
                    });
                }

                const result = await PillTrackingRepository.createPillSchedule(additionalSchedules);
                if (!result){
                    return { 
                        success: false, 
                        message: 'Failed to update from 21-day to 24+4' 
                    };
                }
            } else if (currentPillNumber < 21) {
                // Trong khi đang uống 21-day, thêm 3 viên hormone và 4 viên placebo
                const additionalSchedules = [];
                const baseDate = new Date(currentSchedule.pill_start_date);
                
                for (let day = 22; day <= 28; day++) {
                    const pillDate = new Date(baseDate);
                    pillDate.setDate(pillDate.getDate() + (day - 1));

                    additionalSchedules.push({
                        user_id: new mongoose.Types.ObjectId(userId),
                        menstrual_cycle_id: new mongoose.Types.ObjectId(menstrualCycleId),
                        pill_start_date: pillDate,
                        is_taken: false,
                        pill_number: day,
                        pill_type: '24+4',
                        pill_status: day <= 24 ? 'hormone' : 'placebo',
                        reminder_enabled: pillSchedule.reminder_enabled ?? currentSchedule.reminder_enabled,
                        reminder_time: pillSchedule.reminder_time ?? currentSchedule.reminder_time,
                        max_reminder_times: pillSchedule.max_reminder_times ?? currentSchedule.max_reminder_times,
                        reminder_interval: pillSchedule.reminder_interval ?? currentSchedule.reminder_interval,
                        reminder_sent_timestamps: []
                    });
                }

                await PillTrackingRepository.createPillSchedule(additionalSchedules);
            }
            await PillTrackingRepository.updatePillType(userId, '24+4');
            return { 
                success: true, 
                message: 'Successfully updated from 21-day to 24+4' 
            };
        } catch (error) {
            return { success: false, message: `Error switching pill type: ${error}` };
        }
    }

    private static async switch24Plus4To21Day(
        userId: string,
        currentPillNumber: number
    ): Promise<PillScheduleResponse> {
        try {
            if (currentPillNumber <= 21) {
                // Trong 21 ngày đầu, đổi sang 21-day và vô hiệu hóa các ngày còn lại
                const result = await PillTrackingRepository.deactivatePillsAfterDay(userId, 21);
                if (!result){
                    return { 
                        success: false, 
                        message: 'Failed to update from 24+4 to 21-day' 
                    };
                }
                await PillTrackingRepository.updatePillType(userId, '21-day');
                return { 
                    success: true, 
                    message: 'Successfully updated from 24+4 to 21-day' 
                };
            } else {
                return {
                    success: false,
                    message: 'Cannot change from 24+4 to 21-day after day 21'
                };
            }
        } catch (error) {
            return { success: false, message: `Error switching pill type: ${error}` };
        }
    }

    private static async switch24Plus4To21Plus7(
        userId: string,
        currentPillNumber: number,
    ): Promise<PillScheduleResponse> {
        try {
            if (currentPillNumber <= 21) {
                // Trong 21 ngày đầu, đổi sang 21+7 và chuyển 7 ngày còn lại thành placebo
                const result = await PillTrackingRepository.updatePillsToPlacebo(userId, 22, 28);
                if (!result){
                    return { 
                        success: false, 
                        message: 'Failed to update from 24+4 to 21+7' 
                    };
                }
                await PillTrackingRepository.updatePillType(userId, '21+7');
                return { success: true, message: 'Successfully updated from 24+4 to 21+7' };
            } else {
                return {
                    success: false,
                    message: 'Cannot change from 24+4 to 21+7 after day 21'
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `Error switching pill type: ${error}` 
            };
        }
    }

    private static async switch21Plus7To21Day(
        userId: string
    ): Promise<PillScheduleResponse> {
        try {
            // Đổi sang 21-day và vô hiệu hóa các ngày chưa uống sau ngày 21
            const result = await PillTrackingRepository.deactivatePillsAfterDay(userId, 21);
            if (!result){
                return { 
                    success: false, 
                    message: 'Failed to update from 21+7 to 21-day' 
                };
            }
            await PillTrackingRepository.updatePillType(userId, '21-day');
            return { 
                success: true, 
                message: 'Successfully updated from 21+7 to 21-day' 
            };
        } catch (error) {
            return { success: false, message: `Error switching pill type: ${error}` };
        }
    }

    public static async getMonthlyPillTracking(user_id: string, start_date: string){
        try {
            if (!user_id || !start_date) {
            return {
                success: false,
                message: 'Missing user_id or start_date'
            };
        }
        const start = new Date(start_date);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

        const result = await PillTrackingRepository.getPillTrackingByDateRange(user_id, start, end);

        if (!result){
            return{
                success: false,
                message: 'Cannot find any pill tracking'
            }
        }
        return{
            success: true,
            message: 'Fetched pill tracking monthly successfully',
            data: result
        }
        } catch (error) {
            return{
                success: false,
                message: 'Internal server error'
            }
        }
    }

    public static async getWeeklyPillTracking(user_id: string, start_date: string){
        try {
            if (!user_id || !start_date) {
            return {
                success: false,
                message: 'Missing user_id or start_date' 
            };
        }
        const start = new Date(start_date);
        const end = new Date(start);
        end.setDate(start.getDate() + 6); // 7 ngày
        const result = await PillTrackingRepository.getPillTrackingByDateRange(user_id, start, end);
        console.log(result)
        if (!result){
            return{
                success: false,
                message: 'Cannot find any pill tracking'
            }
        }
        return{
            success: true,
            message: 'Fetched pill tracking weekly successfully',
            data: result
        }
        } catch (error) {
            return{
                success: false,
                message: 'Internal server error'
            }
        }
    }

    public static async markPillAsTaken(pill_track_id: string, taken_time: string) {
        try {
            const updated = await PillTrackingRepository.updateTakenStatus(pill_track_id, taken_time);

            if (!updated) {
                return { 
                    success: false, 
                    message: 'Pill not found' 
                };
            }
            return { 
                success: true, 
                message: 'Marked as taken', 
                data: updated 
            };
        } catch (error) {
            return { 
                success: false, 
                message: 'Internal server error' 
            };
        }
    }

    public static async getPillStatistics(user_id: string) {
        try {
            const pills = await PillTrackingRepository.getPillTrackingByUserId(user_id);

            const total_days = pills.length;
            const taken_days = pills.filter(p => p.is_taken).length;
            const missed_days = total_days - taken_days;

            return {
                success: true,
                message: 'Statistics retrieved successfully',
                data: { 
                    total_days, 
                    taken_days, 
                    missed_days 
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Internal server error',
                error
            };
        }
    }
}

export class PillTrackingReminderService{
    public static async runReminderJob() {
        const TIMEZONE = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';
        const now = DateTime.now().setZone(TIMEZONE);
        console.log(`[CronJob] runReminderJob() executed at ${now.toISO()}`);
        console.log("Giờ hiện tại:", now.toFormat('HH:mm'));

        const schedules = await PillTrackingRepository.findReminderPill();
        let validReminder = 0;
        for (const schedule of schedules) {
            const userId = schedule.user_id.toString();
            const sentCount = schedule.reminder_sent_timestamps?.length ?? 0;
            const pillDate = DateTime.fromJSDate(schedule.pill_start_date).setZone(TIMEZONE).startOf('day');
            const [hour, minute] = schedule.reminder_time.split(':').map(Number);
            const reminderDateTime = pillDate.set({
                hour,
                minute,
                second: 0,
                millisecond: 0
            });
            // Chưa đến thời gian cần nhắc
            if (now < reminderDateTime) 
                continue;

            const user = await UserRepository.findById(userId);
            if (!user) {
                console.warn(`User ${userId} not found`);
                continue;
            }

            // Đủ số lần nhắc tối đa
            if (schedule.max_reminder_times !== undefined && (sentCount + 1) > schedule.max_reminder_times) 
                continue;

            // Kiểm tra khoảng cách giữa các lần gửi
            if (sentCount > 0) {
                const lastSent = DateTime.fromJSDate(schedule.reminder_sent_timestamps![sentCount - 1]).setZone(TIMEZONE);
                const interval = schedule.reminder_interval ?? 15;
                const nextAllowed = lastSent.plus({ minutes: interval });

                if (now < nextAllowed) {
                    continue;
                }
            }
            validReminder++;
            if (validReminder == 0){
                console.log("No pill tracking found needing reminders at this time");
            }
            else if (validReminder == 1){
                console.log("There is 1 pill tracking needing reminders")
            }
            else console.log(`There is ${validReminder} pill tracking needing reminders`)
            
            try {
                console.log(`→ Schedule for user ${user.email}, pill #${schedule.pill_number}, sentCount: ${sentCount + 1}`);
                await MailUtils.sendReminderEmail(user.email, schedule.pill_number, schedule.pill_type, schedule.reminder_time);
                schedule.reminder_sent_timestamps = schedule.reminder_sent_timestamps ?? [];
                schedule.reminder_sent_timestamps.push(now.toJSDate());
                await schedule.save();
                console.log(`Reminder sent to ${user.email} for pill ${schedule.pill_number}`);
            } catch (error) {
                console.error('Failed to send reminder email', error);
            }
        }
    }

    private static task: cron.ScheduledTask | null = null;

    public static startPillReminder() {
        if (this.task) {
            console.log('Pill reminder scheduler already running');
            return;
        }
        console.log('Starting pill reminder scheduler...')
        this.task = cron.schedule('* * * * *', async () => {
            try {
                await PillTrackingReminderService.runReminderJob();
            } catch (error) {
                console.error('Error in pill reminder scheduler:', error);
            }
        });

        console.log('Pill reminder scheduler started');
    }

    public static stopPillReminder() {
        if (this.task) {
            this.task.stop();
            this.task = null;
        }
    }
}