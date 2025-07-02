import { GetScheduleRequest, SetupPillTrackingRequest, UpdateScheduleRequest } from "../dto/requests/PillTrackingRequest";
import { PillScheduleResponse } from "../dto/responses/PillTrackingResponse";
import { IPillTracking, PillTypes } from "../models/PillTracking";
import { PillTrackingRepository } from "../repositories/pillTrackingRepository";
import mongoose from 'mongoose';
import { MailUtils } from "../utils/mailUtils";
import { UserRepository } from "../repositories/userRepository";
import * as cron from 'node-cron'
import { DateTime } from 'luxon';
export class PillTrackingService{
    private static calculatePillSchedule(pillTracking: SetupPillTrackingRequest): Partial<IPillTracking>[] {
        const schedules: Partial<IPillTracking>[] = [];
        const {userId, pill_type, pill_start_date, reminder_time, reminder_enabled, max_reminder_times, reminder_interval} = pillTracking;
        let totalDays: number;
        let activeDays: number;
        
        if (pillTracking.pill_type === '21+7') {
            totalDays = 28;
            activeDays = 21;
        } else {
            totalDays = 28;
            activeDays = 28;
        }
        for (let day = 0; day < totalDays; day++) {
            const start_date = new Date(pill_start_date);
            start_date.setDate(start_date.getDate() + day);

            const isActivePill = day < activeDays;
            schedules.push({
                user_id: new mongoose.Types.ObjectId(userId),
                pill_start_date: start_date,
                is_taken: false,
                pill_number: day + 1,
                pill_type: pill_type as PillTypes,
                pill_status: isActivePill ? 'active' : 'placebo',
                reminder_enabled: reminder_enabled,
                reminder_time: reminder_time,
                max_reminder_times: reminder_enabled ? max_reminder_times ?? 1 : undefined,
                reminder_interval: reminder_enabled ? reminder_interval ?? 15 : undefined,
                reminder_sent_timestamps: []
            });
        }
        return schedules;
    }

    public static async setupPillTracking(pillTracking: SetupPillTrackingRequest){
        try {
            const {userId, pill_type, pill_start_date, reminder_time} = pillTracking;
            console.log(userId, pill_type, pill_start_date, reminder_time)
            if (!userId || !pill_type || !pill_start_date || !reminder_time) {
                return{
                    success: false,
                    message: 'Missing required fields'
                }
            }

            // Validate pillType
            if (!['21+7', '28-day'].includes(pill_type)) {
                return{
                    success: false,
                    message: 'Invalid pillType. Must be "21+7" or "28-day"'
                }
            }

            // Parse and validate startDate
            const parsedStartDate = new Date(pill_start_date);
            if (isNaN(parsedStartDate.getTime())) {
                return{
                    success: false,
                    message: 'Invalid startDate format'
                }
            }
            const hasActiveSchedule = await PillTrackingRepository.checkNextActivePillSchedule(userId);
            if (hasActiveSchedule) {
                return {
                    success: false,
                    message: 'User already has an active pill tracking.',
                };
            }
            const pillSchedules = this.calculatePillSchedule(pillTracking);
            const result = await PillTrackingRepository.createPillSchedule(pillSchedules)
            if (!result)
                return{
                    success: false,
                    message: 'Pill Tracking is fail to create'
                }
            return{
                success: true,
                message: 'Pill tracking schedule created successfully',
                data: result,
            }
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'System error in setup pill tracking'
            }
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

            if (!schedules && schedules.length === 0) {
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
            // 1. Tìm lịch trình hiện tại của người dùng
            const existingSchedules = await PillTrackingRepository.findUserActivePillSchedule(userId);
            if (existingSchedules.length === 0) {
                return {
                    success: false,
                    message: 'No active pill schedule found for this user',
                };
            }

            const currentSchedule = existingSchedules[0];
            // 2. Nếu thay đổi pill_type
            if (pillSchedule.pill_type && pillSchedule.pill_type !== currentSchedule.pill_type) {
                let newStartDate = new Date();
                const lastTaken = existingSchedules
                    .filter(pillTaken => pillTaken.is_taken === true)
                    .sort((a, b) => new Date(b.pill_start_date).getTime() - new Date(a.pill_start_date).getTime())[0];
                if (currentSchedule.pill_type === '21+7' && lastTaken && lastTaken.is_taken === true && lastTaken.pill_number > 21 && lastTaken.pill_number < 28){
                    return{
                        success: false,
                        message: 'Do not change medicine after stopping pill or drinking pill placebo'
                    }
                }
                if (lastTaken) {
                    newStartDate = new Date(new Date(lastTaken.pill_start_date).getTime() + 86400000); // cộng 1 ngày
                }
                
                // Hủy lịch cũ
                await PillTrackingRepository.deactivateAllSchedules(userId);
                console.log(newStartDate.toISOString())
                // Tạo lịch mới từ hôm nay
                const newSchedules = this.calculatePillSchedule({
                    userId: userId,
                    pill_type: pillSchedule.pill_type,
                    pill_start_date: newStartDate.toISOString(),
                    reminder_time: pillSchedule.reminder_time ?? currentSchedule.reminder_time,
                    reminder_enabled: pillSchedule.reminder_enabled ?? currentSchedule.reminder_enabled,
                    max_reminder_times: pillSchedule.max_reminder_times ?? currentSchedule.max_reminder_times,
                    reminder_interval: pillSchedule.reminder_interval ?? currentSchedule.reminder_interval
                });

                const inserted = await PillTrackingRepository.createPillSchedule(newSchedules);

                return {
                    success: true,
                    message: 'Pill type changed. New schedule created.',
                };
            }

            // 3. Các cập nhật khác (isTaken, isActive, reminder)
            const updateFields: Partial<any> = {};

            if (pillSchedule.is_taken !== undefined){
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
            if (
                (pillSchedule.reminder_enabled === true && currentSchedule.reminder_enabled === false) ||
                (pillSchedule.reminder_time !== undefined && pillSchedule.reminder_time !== currentSchedule.reminder_time) ||
                (pillSchedule.max_reminder_times !== undefined && pillSchedule.max_reminder_times !== currentSchedule.max_reminder_times) ||
                (pillSchedule.reminder_interval !== undefined && pillSchedule.reminder_interval !== currentSchedule.reminder_interval)
            ) {
            updateFields.reminder_sent_timestamps = [];
            }

            const result = await PillTrackingRepository.updatePillSchedule(userId, updateFields);
            if (result == 0)
                return{
                    success: false,
                    message: "Nothing to update or update fail"
                }
            return {
                success: true,
                message: `Pill schedule updated successfully (no change pill_type).`
            };
        } catch (error) {
            return {
                success: false,
                message: `Error updating pill schedule: ${error}`,
            };
        } 
    }
}

export class PillTrackingReminderService{
    public static async runReminderJob() {
        const now = DateTime.now().setZone('Asia/Ho_Chi_Minh');
        console.log(`[CronJob] runReminderJob() executed at ${now.toISO()}`);
        console.log("Giờ hiện tại:", now.toFormat('HH:mm'));

        const schedules = await PillTrackingRepository.findReminderPill();
        console.log(`Found ${schedules.length} schedules needing reminders`);

        for (const schedule of schedules) {
            const userId = schedule.user_id.toString();
            const sentCount = schedule.reminder_sent_timestamps?.length ?? 0;

            if (schedule.max_reminder_times !== undefined && sentCount >= schedule.max_reminder_times) continue;

            if (sentCount > 0) {
                const lastSent = DateTime.fromJSDate(schedule.reminder_sent_timestamps![sentCount - 1]).setZone('Asia/Ho_Chi_Minh');
                const diffMins = now.diff(lastSent, 'minutes').minutes;
                if (diffMins < (schedule.reminder_interval ?? 15)) continue;
            }

            const user = await UserRepository.findById(userId);
            if (!user) {
                console.warn(`User ${userId} not found`);
                continue;
            }

            try {
                await MailUtils.sendReminderEmail(user.email, schedule.pill_number, schedule.pill_type, schedule.reminder_time);
                schedule.reminder_sent_timestamps = schedule.reminder_sent_timestamps ?? [];
                schedule.reminder_sent_timestamps.push(now.toJSDate());
                await schedule.save();
                console.log(`Reminder email sent to user ${user.email} for pill ${schedule.pill_number}`);
            } catch (err) {
                console.error('Failed to send reminder email', err);
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