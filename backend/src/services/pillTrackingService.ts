import { GetScheduleRequest, SetupPillTrackingRequest, UpdateScheduleRequest } from "../dto/requests/PillTrackingRequest";
import { PillScheduleResponse } from "../dto/responses/PillTrackingResponse";
import { IPillTracking, PillTypes } from "../models/PillTracking";
import { PillTrackingRepository } from "../repositories/pillTrackingRepository";
import mongoose from 'mongoose';

export class PillTrackingService{
    private static calculatePillSchedule(pillTracking: SetupPillTrackingRequest): Partial<IPillTracking>[] {
        const schedules: Partial<IPillTracking>[] = [];
        const {userId, pill_type, pill_start_date, reminder_time, reminder_enabled} = pillTracking;
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
                reminder_sent: false
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
                if (currentSchedule.pill_type === '21+7' && lastTaken && lastTaken.is_taken === true && lastTaken.pill_number > 21 && lastTaken.pill_number <28){
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
                    reminder_enabled: pillSchedule.reminder_enabled ?? currentSchedule.reminder_enabled
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
            if (pillSchedule.is_active !== undefined) updateFields.is_active = pillSchedule.is_active;
            if (pillSchedule.reminder_enabled !== undefined) updateFields.reminder_enabled = pillSchedule.reminder_enabled;
            if (pillSchedule.reminder_time) updateFields.reminder_time = pillSchedule.reminder_time;

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