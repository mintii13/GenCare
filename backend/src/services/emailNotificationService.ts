import nodemailer from 'nodemailer';
import { GoogleMeetService } from './googleMeetService';

interface AppointmentEmailData {
    customerName: string;
    customerEmail: string;
    consultantName: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    meetingInfo?: {
        meet_url: string;
        meeting_id: string;
        meeting_password?: string; // Optional - chỉ dành cho backward compatibility
    };
    appointmentId: string;
    customerNotes?: string;
}

export class EmailNotificationService {
    private static getTransporter() {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY ?? '',
                pass: process.env.EMAIL_APP_PASSWORD ?? ''
            }
        });
    }

    /**
     * Send appointment confirmation email with REAL Google Meet link
     */
    public static async sendAppointmentConfirmation(emailData: AppointmentEmailData): Promise<{ success: boolean; message: string }> {
        try {
            if (!emailData.meetingInfo) {
                throw new Error('Meeting information is required for appointment confirmation');
            }

            const transporter = this.getTransporter();

            const mailContent = {
                from: `"GenCare - Xác nhận lịch tư vấn" <${process.env.EMAIL_FOR_VERIFY}>`,
                to: emailData.customerEmail,
                subject: `✅ Lịch tư vấn đã được xác nhận - ${emailData.appointmentDate} lúc ${emailData.startTime}`,
                html: `
                <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #2a9d8f; text-align: center;">🎉 Lịch tư vấn đã được xác nhận!</h2>
                        
                        <div style="background-color: #e9f7f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #2a9d8f; margin-top: 0;">📅 THÔNG TIN CUỘC HẸN</h3>
                            <p><strong>👩‍⚕️ Chuyên gia tư vấn:</strong> ${emailData.consultantName}</p>
                            <p><strong>📅 Ngày:</strong> ${emailData.appointmentDate}</p>
                            <p><strong>⏰ Thời gian:</strong> ${emailData.startTime} - ${emailData.endTime}</p>
                            <p><strong>💬 Ghi chú của bạn:</strong> ${emailData.customerNotes ?? 'Không có'}</p>
                        </div>

                        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h3 style="color: #856404; margin-top: 0;">📹 THÔNG TIN GOOGLE MEET</h3>
                            <p style="margin: 10px 0;">
                                <strong>🔗 Link tham gia:</strong><br>
                                <a href="${emailData.meetingInfo.meet_url}" style="color: #007bff; text-decoration: none; word-break: break-all;">
                                    ${emailData.meetingInfo.meet_url}
                                </a>
                            </p>
                            <p style="margin: 10px 0;">
                                <strong>🆔 Meeting ID:</strong> <code style="background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px;">${emailData.meetingInfo.meeting_id}</code>
                            </p>
                        </div>

                        ${GoogleMeetService.generateMeetingInstructions(emailData.meetingInfo)}

                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #495057; margin-top: 0;">✅ CHECKLIST TRƯỚC KHI THAM GIA</h4>
                            <ul style="color: #495057;">
                                <li>✅ Kiểm tra kết nối internet</li>
                                <li>✅ Test camera và microphone</li>
                                <li>✅ Tìm nơi yên tĩnh</li>
                                <li>✅ Chuẩn bị các câu hỏi cần tư vấn</li>
                                <li>✅ Đóng các ứng dụng không cần thiết</li>
                                <li>✅ Đảm bảo đã đăng nhập tài khoản Google</li>
                            </ul>
                        </div>

                        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #bee5eb;">
                            <h4 style="color: #0c5460; margin-top: 0;">💡 QUAN TRỌNG</h4>
                            <p style="color: #0c5460; margin: 0;">
                                Đây là cuộc họp Google Meet thực tế được tạo tự động. 
                                Bạn sẽ được thêm vào lịch Google Calendar và có thể tham gia trực tiếp từ link trên.
                            </p>
                        </div>

                        <p style="text-align: center; color: #666; font-style: italic;">
                            Nếu bạn gặp khó khăn khi tham gia, vui lòng liên hệ ngay với chúng tôi.
                        </p>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            <strong style="color: #2a9d8f;">${process.env.APP_NAME ?? 'GenCare'}</strong>
                        </p>
                    </div>
                </body>`
            };

            await transporter.sendMail(mailContent);

            return {
                success: true,
                message: 'Appointment confirmation email with real Google Meet sent successfully'
            };
        } catch (error) {
            console.error('Error sending appointment confirmation email:', error);
            return {
                success: false,
                message: `Failed to send confirmation email: ${error.message}`
            };
        }
    }

    /**
     * Send meeting reminder email - Updated for real Google Meet
     */
    public static async sendMeetingReminder(emailData: AppointmentEmailData, minutesBefore: number): Promise<{ success: boolean; message: string }> {
        try {
            if (!emailData.meetingInfo) {
                throw new Error('Meeting information is required for reminder');
            }

            const transporter = this.getTransporter();

            const mailContent = {
                from: `"GenCare - Nhắc lịch tư vấn" <${process.env.EMAIL_FOR_VERIFY}>`,
                to: emailData.customerEmail,
                subject: `⏰ Nhắc nhở: Cuộc tư vấn sắp bắt đầu trong ${minutesBefore} phút`,
                html: `
                <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #ff6b35; text-align: center;">⏰ Nhắc nhở cuộc tư vấn</h2>
                        
                        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <h3 style="color: #856404; margin-top: 0;">Cuộc tư vấn sẽ bắt đầu trong ${minutesBefore} phút!</h3>
                            <p><strong>Chuyên gia:</strong> ${emailData.consultantName}</p>
                            <p><strong>Thời gian:</strong> ${emailData.startTime} - ${emailData.endTime}</p>
                        </div>

                        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <h3 style="color: #155724; margin-top: 0;">📹 THAM GIA NGAY</h3>
                            <p style="margin: 15px 0;">
                                <a href="${emailData.meetingInfo.meet_url}" 
                                   style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                    🚀 THAM GIA GOOGLE MEET
                                </a>
                            </p>
                            <p style="margin: 10px 0; font-size: 14px;">
                                <strong>Meeting ID:</strong> <code style="background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px;">${emailData.meetingInfo.meeting_id}</code>
                            </p>
                        </div>

                        ${GoogleMeetService.generateReminderText(minutesBefore)}

                        <p style="text-align: center; margin-top: 30px;">
                            <strong style="color: #2a9d8f;">${process.env.APP_NAME ?? 'GenCare'}</strong>
                        </p>
                    </div>
                </body>`
            };

            await transporter.sendMail(mailContent);

            return {
                success: true,
                message: 'Meeting reminder email sent successfully'
            };
        } catch (error) {
            console.error('Error sending meeting reminder email:', error);
            return {
                success: false,
                message: `Failed to send reminder email: ${error.message}`
            };
        }
    }

    /**
     * Send appointment cancellation email
     */
    public static async sendAppointmentCancellation(emailData: AppointmentEmailData, cancelledBy: string, reason?: string): Promise<{ success: boolean; message: string }> {
        try {
            const transporter = this.getTransporter();

            const mailContent = {
                from: `"GenCare - Hủy lịch tư vấn" <${process.env.EMAIL_FOR_VERIFY}>`,
                to: emailData.customerEmail,
                subject: `❌ Lịch tư vấn đã được hủy - ${emailData.appointmentDate} lúc ${emailData.startTime}`,
                html: `
                <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #dc3545; text-align: center;">❌ Lịch tư vấn đã được hủy</h2>
                        
                        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #721c24; margin-top: 0;">📅 THÔNG TIN CUỘC HẸN ĐÃ HỦY</h3>
                            <p><strong>👩‍⚕️ Chuyên gia tư vấn:</strong> ${emailData.consultantName}</p>
                            <p><strong>📅 Ngày:</strong> ${emailData.appointmentDate}</p>
                            <p><strong>⏰ Thời gian:</strong> ${emailData.startTime} - ${emailData.endTime}</p>
                            <p><strong>🙋‍♂️ Người hủy:</strong> ${cancelledBy}</p>
                            ${reason ? `<p><strong>📝 Lý do:</strong> ${reason}</p>` : ''}
                        </div>

                        <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #0c5460; margin: 0; text-align: center;">
                                Chúng tôi xin lỗi vì sự bất tiện này. Bạn có thể đặt lịch tư vấn mới bất cứ lúc nào.
                            </p>
                        </div>

                        <p style="text-align: center; margin-top: 30px;">
                            <strong style="color: #2a9d8f;">${process.env.APP_NAME ?? 'GenCare'}</strong>
                        </p>
                    </div>
                </body>`
            };

            await transporter.sendMail(mailContent);

            return {
                success: true,
                message: 'Appointment cancellation email sent successfully'
            };
        } catch (error) {
            console.error('Error sending appointment cancellation email:', error);
            return {
                success: false,
                message: `Failed to send cancellation email: ${error.message}`
            };
        }
    }

}