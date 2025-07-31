import * as cron from 'node-cron';
import { AppointmentRepository } from '../repositories/appointmentRepository';
import { AppointmentService } from './appointmentService';

/**
 * Service để tự động gửi reminder emails
 * Sử dụng node-cron để schedule task
 */
export class ReminderSchedulerService {
    private static isRunning = false;
    private static schedulerTask: cron.ScheduledTask | null = null;

    /**
     * Start the reminder scheduler
     * Runs every 5 minutes to check for appointments needing reminders
     */
    public static startScheduler(): void {
        if (this.isRunning) {
            console.log('Reminder scheduler is already running');
            return;
        }

        console.log('Starting appointment reminder scheduler...');

        // Run every 5 minutes: '*/5 * * * *'
        // For testing, you can use '*/1 * * * *' (every minute)
        this.schedulerTask = cron.schedule('*/5 * * * *', async () => {
            try {
                await this.checkAndSendReminders();
            } catch (error) {
                console.error('Error in reminder scheduler:', error);
            }
        });
        this.isRunning = true;
        console.log('Reminder scheduler started successfully');
    }

    /**
     * Stop the scheduler
     */
    public static stopScheduler(): void {
        if (this.schedulerTask) {
            this.schedulerTask.stop();
            this.schedulerTask = null;
        }
        this.isRunning = false;
        console.log('Reminder scheduler stopped');
    }

    /**
     * Check for appointments that need reminders and send them
     */
    private static async checkAndSendReminders(): Promise<void> {
        try {
            console.log('Checking for appointments needing reminders...');

            // Calculate time range: appointments starting in 10-20 minutes
            const now = new Date();
            const startRange = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
            const endRange = new Date(now.getTime() + 20 * 60 * 1000);   // 20 minutes from now

            // Get today's confirmed appointments
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const appointments = await AppointmentRepository.findAll(
                'confirmed', // only confirmed appointments
                today,       // from today
                tomorrow     // until tomorrow
            );

            console.log(`Found ${appointments.length} confirmed appointments today`);

            let remindersProcessed = 0;
            let remindersSent = 0;

            for (const appointment of appointments) {
                try {
                    // Skip if reminder already sent
                    if (appointment.meeting_info?.reminder_sent) {
                        continue;
                    }

                    // Check if appointment is in the reminder time window
                    const appointmentDateTime = new Date(appointment.appointment_date);
                    const [hours, minutes] = appointment.start_time.split(':').map(Number);
                    appointmentDateTime.setHours(hours, minutes, 0, 0);

                    if (appointmentDateTime >= startRange && appointmentDateTime <= endRange) {
                        console.log(`Sending reminder for appointment ${appointment._id} at ${appointment.start_time}`);

                        const result = await AppointmentService.sendMeetingReminder(appointment._id.toString());

                        remindersProcessed++;

                        if (result.success) {
                            remindersSent++;
                            console.log(` Reminder sent successfully for appointment ${appointment._id}`);
                        } else {
                            console.error(` Failed to send reminder for appointment ${appointment._id}:`, result.message);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing reminder for appointment ${appointment._id}:`, error);
                }
            }

            if (remindersProcessed > 0) {
                console.log(`Reminder check completed: ${remindersSent}/${remindersProcessed} reminders sent successfully`);
            } else {
                console.log('No appointments found needing reminders at this time');
            }

            // Check for completed appointments needing feedback reminders
            await this.checkAndSendFeedbackReminders();

        } catch (error) {
            console.error('Error in checkAndSendReminders:', error);
        }
    }

    /**
     * Check for completed appointments that need feedback reminders
     * Send reminder if appointment was completed 24 hours ago and no feedback yet
     */
    private static async checkAndSendFeedbackReminders(): Promise<void> {
        try {
            console.log('Checking for completed appointments needing feedback reminders...');

            const now = new Date();
            
            // Look for appointments completed 24-48 hours ago (1 day reminder window)
            const startTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago
            const endTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);   // 24 hours ago

            // Find completed appointments without feedback in the time range
            const appointments = await AppointmentRepository.findAll(
                'completed',
                startTime,
                endTime
            );

            console.log(`Found ${appointments.length} completed appointments needing feedback reminders`);

            let feedbackRemindersProcessed = 0;
            let feedbackRemindersSent = 0;

            for (const appointment of appointments) {
                try {
                    // Check if we already sent a feedback reminder
                    if (appointment.feedback) {
                        continue;
                    }

                    console.log(`Sending feedback reminder for appointment ${appointment._id}`);

                    const result = await AppointmentService.sendFeedbackReminderForAppointment(appointment._id.toString());

                    feedbackRemindersProcessed++;

                    if (result.success) {
                        feedbackRemindersSent++;
                        console.log(` Feedback reminder sent successfully for appointment ${appointment._id}`);
                        
                        // Mark reminder as sent to avoid duplicate sends
                        await AppointmentRepository.updateById(appointment._id.toString(), {
                            feedback_reminder_sent: true
                        });
                    } else {
                        console.error(` Failed to send feedback reminder for appointment ${appointment._id}:`, result.message);
                    }
                } catch (error) {
                    console.error(`Error processing feedback reminder for appointment ${appointment._id}:`, error);
                }
            }

            if (feedbackRemindersProcessed > 0) {
                console.log(`Feedback reminder check completed: ${feedbackRemindersSent}/${feedbackRemindersProcessed} feedback reminders sent successfully`);
            } else {
                console.log('No completed appointments found needing feedback reminders at this time');
            }

        } catch (error) {
            console.error('Error in checkAndSendFeedbackReminders:', error);
        }
    }

    /**
     * Manual trigger for testing purposes
     */
    public static async triggerReminderCheck(): Promise<{ success: boolean; message: string; stats?: any }> {
        try {
            console.log('Manual reminder check triggered...');
            await this.checkAndSendReminders();

            return {
                success: true,
                message: 'Reminder check completed successfully'
            };
        } catch (error: any) {
            console.error('Error in manual reminder check:', error);
            return {
                success: false,
                message: `Error in reminder check: ${error.message}`
            };
        }
    }

    /**
     * Force send reminder for specific appointment (for controller compatibility)
     */
    public static async forceSendReminder(appointmentId: string): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`Force sending reminder for appointment ${appointmentId}`);
            const result = await AppointmentService.sendMeetingReminder(appointmentId);
            return result;
        } catch (error: any) {
            console.error('Error in force send reminder:', error);
            return {
                success: false,
                message: `Error sending reminder: ${error.message}`
            };
        }
    }

    /**
     * Restart scheduler (stop and start again)
     */
    public static restartScheduler(): void {
        console.log('Restarting reminder scheduler...');
        this.stopScheduler();
        // Wait a moment before restarting
        setTimeout(() => {
            this.startScheduler();
        }, 1000);
    }

    /**
     * Get scheduler status
     */
    public static getStatus(): {
        isRunning: boolean;
        nextCheck?: string;
        systemTime: string;
    } {
        return {
            isRunning: this.isRunning,
            nextCheck: this.isRunning ? 'Every 5 minutes' : 'Scheduler stopped',
            systemTime: new Date().toISOString()
        };
    }

    /**
     * Get upcoming appointments that will need reminders
     */
    public static async getUpcomingReminders(): Promise<{
        success: boolean;
        data?: {
            appointments: any[];
            total: number;
        };
        message?: string;
    }> {
        try {
            const now = new Date();
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            // Get today's confirmed appointments
            const appointments = await AppointmentRepository.findAll(
                'confirmed',
                now,
                endOfDay
            );

            const upcomingReminders = appointments
                .filter(apt => !apt.meeting_info?.reminder_sent)
                .map(apt => {
                    const appointmentDateTime = new Date(apt.appointment_date);
                    const [hours, minutes] = apt.start_time.split(':').map(Number);
                    appointmentDateTime.setHours(hours, minutes, 0, 0);

                    const timeUntilAppointment = appointmentDateTime.getTime() - now.getTime();
                    const minutesUntil = Math.round(timeUntilAppointment / (1000 * 60));

                    // Safe access to customer name
                    let customerName = 'Unknown';
                    if (apt.customer_id && typeof apt.customer_id === 'object' && 'full_name' in apt.customer_id) {
                        customerName = (apt.customer_id as any).full_name;
                    }

                    // Safe access to consultant name
                    let consultantName = 'Unknown';
                    if (apt.consultant_id && typeof apt.consultant_id === 'object') {
                        const consultant = apt.consultant_id as any;
                        if (consultant.user_id && typeof consultant.user_id === 'object' && 'full_name' in consultant.user_id) {
                            consultantName = consultant.user_id.full_name;
                        }
                    }

                    return {
                        appointment_id: apt._id,
                        appointment_time: apt.start_time,
                        customer_name: customerName,
                        consultant_name: consultantName,
                        minutes_until_appointment: minutesUntil,
                        will_send_reminder: minutesUntil >= 10 && minutesUntil <= 20
                    };
                })
                .sort((a, b) => a.minutes_until_appointment - b.minutes_until_appointment);

            return {
                success: true,
                data: {
                    appointments: upcomingReminders,
                    total: upcomingReminders.length
                }
            };
        } catch (error: any) {
            console.error('Error getting upcoming reminders:', error);
            return {
                success: false,
                message: `Error: ${error.message}`
            };
        }
    }
}