import { Router, Request, Response} from 'express';
import { GetScheduleRequest, SetupPillTrackingRequest, UpdateScheduleRequest } from '../dto/requests/PillTrackingRequest';
import { PillTrackingService } from '../services/pillTrackingService';
import { PillTrackingRepository } from '../repositories/pillTrackingRepository';
import { UserRepository } from '../repositories/userRepository';
import { MailUtils } from '../utils/mailUtils';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import { TimeUtils } from '../utils/timeUtils';
const router = Router();

router.post('/setup', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const TIMEZONE = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';
        
        // Cho phép người dùng chọn ngày bắt đầu uống thuốc
        let pill_start_date: string;
        if (req.body.pill_start_date) {
            // Nếu người dùng cung cấp ngày bắt đầu
            pill_start_date = req.body.pill_start_date;
        } else {
            // Mặc định là ngày hôm nay
            pill_start_date = DateTime.now().setZone(TIMEZONE).startOf('day').toISO();
        }
        
        const requestData: SetupPillTrackingRequest = {
            userId: (req.user as any).userId,
            pill_type: req.body.pill_type,
            pill_start_date,
            reminder_time: req.body.reminder_time,
            reminder_enabled: req.body.reminder_enabled,
        };

        console.log('[PillTrackingController] Setting up pill tracking with start date:', pill_start_date);

        const result = await PillTrackingService.setupPillTracking(requestData);

        if (!result.success) {
            res.status(400).json(result);
        } else {
            res.status(201).json(result);
        }
    } catch (error) {
        console.error('Error in /setup:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

router.get('/weekly', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const start_date = req.query.start_date as string;
        const user_id = (req.user as any).userId;
        const result = await PillTrackingService.getWeeklyPillTracking(user_id, start_date);
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Internal server error'
        });
    }
})

router.get('/monthly', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const start_date = req.query.start_date as string;
        const user_id = (req.user as any).userId;
        const result = await PillTrackingService.getMonthlyPillTracking(user_id, start_date);
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Internal server error'
        });
    }
})

router.patch('/mark-as-taken/:id', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const pill_tracking_id = req.params.id;

        const result = await PillTrackingService.markPillAsTaken(pill_tracking_id);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error'
        });
    }
});

// PATCH /api/pill-tracking/update-schedule/:cycleId - Cập nhật tất cả schedules của một chu kỳ
router.patch('/update-schedule/:cycleId', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const menstrualCycleId = req.params.cycleId;
        const userId = (req.user as any).userId;
        
        console.log('[PillTrackingController] PATCH /update-schedule/:cycleId called');
        console.log('[PillTrackingController] Request params:', req.params);
        console.log('[PillTrackingController] Request body:', req.body);
        console.log('[PillTrackingController] User ID:', userId);
        console.log('[PillTrackingController] Menstrual cycle ID:', menstrualCycleId);
        
        // Kiểm tra xem chu kỳ có thuộc về user này không
        const schedules = await PillTrackingRepository.getPillSchedulesByCycle(userId, menstrualCycleId);
        console.log('[PillTrackingController] Found schedules count:', schedules.length);
        
        if (!schedules || schedules.length === 0) {
            console.log('[PillTrackingController] No schedules found, returning 404');
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch uống thuốc cho chu kỳ này'
            });
            return;
        }
        
        // Cập nhật tất cả schedules của chu kỳ này
        const updateFields: any = {};
        if (req.body.reminder_time) updateFields.reminder_time = req.body.reminder_time;
        if (req.body.pill_type) updateFields.pill_type = req.body.pill_type;
        if (req.body.reminder_enabled !== undefined) updateFields.reminder_enabled = req.body.reminder_enabled;
        
        console.log('[PillTrackingController] Update fields:', updateFields);
        
        const result = await PillTrackingRepository.updatePillSchedulesByCycle(userId, menstrualCycleId, updateFields);
        
        console.log('[PillTrackingController] Update result:', result);
        
        if (result > 0) {
            console.log('[PillTrackingController] Update successful, returning 200');
            res.status(200).json({
                success: true,
                message: `Đã cập nhật ${result} lịch uống thuốc thành công`,
                data: { updatedCount: result }
            });
        } else {
            console.log('[PillTrackingController] Update failed, returning 400');
            res.status(400).json({
                success: false,
                message: 'Không thể cập nhật lịch uống thuốc'
            });
        }
    } catch (error) {
        console.error('[PillTrackingController] Error updating cycle schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật lịch uống thuốc'
        });
    }
});

router.get('/statistics', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user_id = req.jwtUser.userId;
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing user_id'
            });
        }

        const result = await PillTrackingService.getPillStatistics(user_id);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
})

router.get('/', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).userId;
        const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
        const pillSchedule: GetScheduleRequest = {userId, startDate, endDate};
        const result = await PillTrackingService.getUserPillSchedule(pillSchedule);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

router.patch('/', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
        try {
            const user_id = (req.user as any).userId;
            const {is_taken, reminder_enabled, reminder_time, is_active, pill_type} = req.body;
            if (is_taken === undefined && is_active === undefined && reminder_enabled === undefined && !reminder_time && 
                !pill_type) {
                res.status(400).json({
                    success: false,
                    message: 'No updatable fields provided'
                });
                return;
            }
            const updateRequest: UpdateScheduleRequest = {user_id};

            if (is_taken != null){
                updateRequest.is_taken = is_taken;
            }
            if (reminder_enabled !== undefined) 
                updateRequest.reminder_enabled = reminder_enabled;
            if (reminder_time) 
                updateRequest.reminder_time = reminder_time;
            if (pill_type) 
                updateRequest.pill_type = pill_type;
            const result = await PillTrackingService.updatePillSchedule(updateRequest);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
})

// DELETE /api/pill-tracking/clear - Xóa tất cả pill tracking cũ
router.delete('/clear', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).userId;
        console.log('[PillTrackingController] Clearing pill tracking for user:', userId);
        
        const deletedCount = await PillTrackingRepository.deleteUserPillSchedule(new mongoose.Types.ObjectId(userId));
        
        res.status(200).json({
            success: true,
            message: `Đã xóa ${deletedCount} lịch uống thuốc cũ`,
            data: {
                deletedCount
            }
        });
    } catch (error) {
        console.error('[PillTrackingController] Error clearing pill tracking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa lịch uống thuốc cũ'
        });
    }
});

// POST /api/pill-tracking/test-reminder - Test gửi mail nhắc nhở
router.post('/test-reminder', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).userId;
        console.log('[PillTrackingController] Testing reminder for user:', userId);
        
        // Lấy thông tin user
        const user = await UserRepository.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
            return;
        }
        
        // Lấy pill schedule hiện tại
        const schedules = await PillTrackingRepository.findUserActivePillSchedule(userId);
        if (!schedules || schedules.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Không có lịch uống thuốc nào'
            });
            return;
        }
        
        const currentSchedule = schedules[0];
        
        // Gửi mail test
        await MailUtils.sendReminderEmail(
            user.email, 
            currentSchedule.pill_number, 
            currentSchedule.pill_type, 
            currentSchedule.reminder_time
        );
        
        res.status(200).json({
            success: true,
            message: `Đã gửi mail nhắc nhở test đến ${user.email}`,
            data: {
                email: user.email,
                pillNumber: currentSchedule.pill_number,
                pillType: currentSchedule.pill_type,
                reminderTime: currentSchedule.reminder_time
            }
        });
    } catch (error) {
        console.error('[PillTrackingController] Error testing reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi mail test'
        });
    }
});

// POST /api/pill-tracking/mark-taken/:pillId - Đánh dấu viên thuốc đã uống
router.post('/mark-taken/:pillId', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { pillId } = req.params;
        console.log('[PillTrackingController] Marking pill as taken:', pillId);
        
        const result = await PillTrackingService.markPillAsTaken(pillId);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('[PillTrackingController] Error marking pill as taken:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu thuốc đã uống'
        });
    }
});

// POST /api/pill-tracking/disable-reminder - Tắt nhắc nhở uống thuốc
router.post('/disable-reminder', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).userId;
        console.log('[PillTrackingController] Disabling reminder for user:', userId);
        
        // Cập nhật tất cả pill schedules của user để tắt nhắc nhở
        const result = await PillTrackingRepository.updatePillSchedule(userId, { reminder_enabled: false });
        
        if (result > 0) {
            res.status(200).json({
                success: true,
                message: 'Đã tắt nhắc nhở uống thuốc',
                data: {
                    updatedCount: result
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch uống thuốc để cập nhật'
            });
        }
    } catch (error) {
        console.error('[PillTrackingController] Error disabling reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tắt nhắc nhở uống thuốc'
        });
    }
});

// POST /api/pill-tracking/enable-reminder - Bật nhắc nhở uống thuốc
router.post('/enable-reminder', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).userId;
        console.log('[PillTrackingController] Enabling reminder for user:', userId);
        
        // Cập nhật tất cả pill schedules của user để bật nhắc nhở
        const result = await PillTrackingRepository.updatePillSchedule(userId, { reminder_enabled: true });
        
        if (result > 0) {
            res.status(200).json({
                success: true,
                message: 'Đã bật nhắc nhở uống thuốc',
                data: {
                    updatedCount: result
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch uống thuốc để cập nhật'
            });
        }
    } catch (error) {
        console.error('[PillTrackingController] Error enabling reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi bật nhắc nhở uống thuốc'
        });
    }
});

// GET /api/pill-tracking/debug - Debug endpoint để xem lịch uống thuốc
router.get('/debug', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).userId;
        const today = new Date();
        const todayWithTimezone = TimeUtils.getCurrentTimeInZone();
        todayWithTimezone.setHours(0, 0, 0, 0);
        
        console.log('[PillTrackingController] Debug request for user:', userId);
        console.log('[PillTrackingController] Today (UTC):', today.toISOString());
        console.log('[PillTrackingController] Today (with timezone):', todayWithTimezone.toISOString());
        
        // Lấy tất cả lịch uống thuốc
        const allSchedules = await PillTrackingRepository.getUserPillScheduleByDate(userId);
        
        // Lấy viên thuốc cho hôm nay
        const todayPill = await PillTrackingRepository.findTodayPill(userId);
        
        // Lấy lịch uống thuốc active
        const activeSchedules = await PillTrackingRepository.findUserActivePillSchedule(userId);
        
        res.status(200).json({
            success: true,
            data: {
                timezone: process.env.TIMEZONE || 'Asia/Ho_Chi_Minh',
                today_utc: today.toISOString(),
                today_with_timezone: todayWithTimezone.toISOString(),
                allSchedules: allSchedules.map(s => ({
                    _id: s._id,
                    pill_number: s.pill_number,
                    pill_start_date: s.pill_start_date,
                    pill_start_date_iso: s.pill_start_date.toISOString(),
                    is_taken: s.is_taken,
                    pill_status: s.pill_status
                })),
                todayPill: todayPill ? {
                    _id: todayPill._id,
                    pill_number: todayPill.pill_number,
                    pill_start_date: todayPill.pill_start_date,
                    pill_start_date_iso: todayPill.pill_start_date.toISOString(),
                    is_taken: todayPill.is_taken,
                    pill_status: todayPill.pill_status
                } : null,
                activeSchedules: activeSchedules.map(s => ({
                    _id: s._id,
                    pill_number: s.pill_number,
                    pill_start_date: s.pill_start_date,
                    pill_start_date_iso: s.pill_start_date.toISOString(),
                    is_taken: s.is_taken,
                    pill_status: s.pill_status
                }))
            }
        });
    } catch (error) {
        console.error('[PillTrackingController] Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi debug lịch uống thuốc'
        });
    }
});

export default router
