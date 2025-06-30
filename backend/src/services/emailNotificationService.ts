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
        meeting_password?: string;
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
     * Send appointment confirmation email with meeting link
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
                            <h3 style="color: #856404; margin-top: 0;">🎥 THÔNG TIN CUỘC HỌP ONLINE</h3>
                            <div style="background-color: white; padding: 15px; border-radius: 5px; font-family: monospace;">
                                <p style="margin: 5px 0;"><strong>🔗 Link tham gia:</strong></p>
                                <a href="${emailData.meetingInfo.meet_url}" style="color: #1a73e8; text-decoration: none; font-size: 16px; background-color: #f8f9fa; padding: 8px; border-radius: 4px; display: inline-block;">${emailData.meetingInfo.meet_url}</a>
                                
                                <p style="margin: 15px 0 5px 0;"><strong>🆔 Meeting ID:</strong> <span style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 3px;">${emailData.meetingInfo.meeting_id}</span></p>
                                
                                ${emailData.meetingInfo.meeting_password ?
                        `<p style="margin: 5px 0;"><strong>🔐 Mật khẩu:</strong> <span style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 3px;">${emailData.meetingInfo.meeting_password}</span></p>`
                        : ''
                    }
                            </div>
                        </div>

                        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #0c5460; margin-top: 0;">📱 HƯỚNG DẪN THAM GIA</h3>
                            <ol style="color: #0c5460;">
                                <li>Nhấp vào link tham gia ở trên 5-10 phút trước giờ hẹn</li>
                                <li>Hoặc mở Google Meet và nhập Meeting ID</li>
                                <li>${emailData.meetingInfo.meeting_password ?
                        'Nhập mật khẩu khi được yêu cầu' : 'Chờ chuyên gia chấp nhận bạn vào phòng'}</li>
                                <li>Đảm bảo camera và microphone hoạt động tốt</li>
                            </ol>
                        </div>

                        <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #721c24; margin-top: 0;">⚠️ LƯU Ý QUAN TRỌNG</h4>
                            <ul style="color: #721c24; margin: 0;">
                                <li>Vui lòng tham gia đúng giờ để tối ưu thời gian tư vấn</li>
                                <li>Chuẩn bị sẵn các câu hỏi bạn muốn tư vấn</li>
                                <li>Tìm nơi yên tĩnh, tránh tiếng ồn</li>
                                <li>Nếu cần hủy/thay đổi lịch, vui lòng thông báo trước ít nhất 4 tiếng</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${emailData.meetingInfo.meet_url}" style="background-color: #2a9d8f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">🎥 THAM GIA CUỘC HỌP</a>
                        </div>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            Mã cuộc hẹn: <strong>${emailData.appointmentId}</strong><br>
                            Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi qua email này.
                        </p>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            <strong style="color: #2a9d8f;">${process.env.APP_NAME ?? 'GenCare'}</strong><br>
                            <em>Chăm sóc sức khỏe sinh sản toàn diện</em>
                        </p>
                    </div>
                </body>`
            };

            await transporter.sendMail(mailContent);

            return {
                success: true,
                message: 'Appointment confirmation email sent successfully'
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
     * Send meeting reminder email
     */
    public static async sendMeetingReminder(emailData: AppointmentEmailData, minutesBefore: number = 15): Promise<{ success: boolean; message: string }> {
        try {
            if (!emailData.meetingInfo) {
                throw new Error('Meeting information is required for reminder');
            }

            const transporter = this.getTransporter();

            const mailContent = {
                from: `"GenCare - Nhắc nhở cuộc hẹn" <${process.env.EMAIL_FOR_VERIFY}>`,
                to: emailData.customerEmail,
                subject: `⏰ Nhắc nhở: Cuộc tư vấn bắt đầu trong ${minutesBefore} phút - ${emailData.appointmentDate}`,
                html: `
                <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #ff6b35; text-align: center;">⏰ NHẮC NHỞ CUỘC HẸN</h2>
                        
                        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #ffc107;">
                            <h3 style="color: #856404; margin-top: 0;">Cuộc tư vấn của bạn sẽ bắt đầu trong <strong>${minutesBefore} phút</strong>!</h3>
                            <p style="color: #856404; font-size: 18px;"><strong>${emailData.appointmentDate} lúc ${emailData.startTime}</strong></p>
                            <p style="color: #856404;">với chuyên gia <strong>${emailData.consultantName}</strong></p>
                        </div>

                        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #155724; margin-top: 0;">🎥 THAM GIA NGAY</h3>
                            <div style="text-align: center; margin: 15px 0;">
                                <a href="${emailData.meetingInfo.meet_url}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">🚀 THAM GIA CUỘC HỌP</a>
                            </div>
                            <p style="text-align: center; color: #155724;">
                                <strong>Meeting ID:</strong> ${emailData.meetingInfo.meeting_id}<br>
                                ${emailData.meetingInfo.meeting_password ? `<strong>Mật khẩu:</strong> ${emailData.meetingInfo.meeting_password}` : ''}
                            </p>
                        </div>

                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #495057; margin-top: 0;">✅ CHECKLIST TRƯỚC KHI THAM GIA</h4>
                            <ul style="color: #495057;">
                                <li>✅ Kiểm tra kết nối internet</li>
                                <li>✅ Test camera và microphone</li>
                                <li>✅ Tìm nơi yên tĩnh</li>
                                <li>✅ Chuẩn bị các câu hỏi cần tư vấn</li>
                                <li>✅ Đóng các ứng dụng không cần thiết</li>
                            </ul>
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
                subject: `❌ Lịch tư vấn đã bị hủy - ${emailData.appointmentDate} lúc ${emailData.startTime}`,
                html: `
                <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #dc3545; text-align: center;">❌ Lịch tư vấn đã bị hủy</h2>
                        
                        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                            <h3 style="color: #721c24; margin-top: 0;">📅 THÔNG TIN CUỘC HẸN BỊ HỦY</h3>
                            <p><strong>👩‍⚕️ Chuyên gia tư vấn:</strong> ${emailData.consultantName}</p>
                            <p><strong>📅 Ngày:</strong> ${emailData.appointmentDate}</p>
                            <p><strong>⏰ Thời gian:</strong> ${emailData.startTime} - ${emailData.endTime}</p>
                            <p><strong>🔄 Hủy bởi:</strong> ${cancelledBy}</p>
                            ${reason ? `<p><strong>📝 Lý do:</strong> ${reason}</p>` : ''}
                        </div>

                        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #0c5460; margin-top: 0;">💡 BẠN CÓ THỂ LÀM GÌ TIẾP THEO?</h3>
                            <ul style="color: #0c5460;">
                                <li>Đặt lịch tư vấn mới với cùng chuyên gia</li>
                                <li>Chọn chuyên gia khác phù hợp với lịch của bạn</li>
                                <li>Liên hệ với chúng tôi nếu bạn có thắc mắc</li>
                            </ul>
                        </div>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            Mã cuộc hẹn: <strong>${emailData.appointmentId}</strong><br>
                            Chúng tôi xin lỗi vì sự bất tiện này và mong được phục vụ bạn trong tương lai.
                        </p>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            <strong style="color: #2a9d8f;">${process.env.APP_NAME ?? 'GenCare'}</strong><br>
                            <em>Chăm sóc sức khỏe sinh sản toàn diện</em>
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