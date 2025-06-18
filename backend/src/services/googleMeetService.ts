import { RandomUtils } from '../utils/randomUtils';

interface MeetingDetails {
    meet_url: string;
    meeting_id: string;
    meeting_password?: string;
}

export class GoogleMeetService {
    /**
     * Generate Google Meet link format
     * Format: https://meet.google.com/xxx-yyyy-zzz
     */
    public static generateMeetLink(): MeetingDetails {
        // Generate meeting ID in Google Meet format (3 groups of 4 characters separated by hyphens)
        const group1 = this.generateRandomString(3); // abc
        const group2 = this.generateRandomString(4); // defg
        const group3 = this.generateRandomString(3); // hij

        const meetingId = `${group1}-${group2}-${group3}`;
        const meetUrl = `https://meet.google.com/${meetingId}`;

        // Optional: Generate meeting password for extra security
        const meetingPassword = this.generateMeetingPassword();

        return {
            meet_url: meetUrl,
            meeting_id: meetingId,
            meeting_password: meetingPassword
        };
    }

    /**
     * Generate random string for meeting ID
     * Uses lowercase letters only (Google Meet format)
     */
    private static generateRandomString(length: number): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate meeting password (6 digits)
     */
    private static generateMeetingPassword(): string {
        return RandomUtils.generateRandomOTP(100000, 999999);
    }

    /**
     * Validate Google Meet URL format
     */
    public static isValidMeetUrl(url: string): boolean {
        const meetUrlPattern = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
        return meetUrlPattern.test(url);
    }

    /**
     * Extract meeting ID from Meet URL
     */
    public static extractMeetingId(meetUrl: string): string | null {
        const match = meetUrl.match(/https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
        return match ? match[1] : null;
    }

    /**
     * Format meeting info for display
     */
    public static formatMeetingInfo(meetingDetails: MeetingDetails): string {
        return `
Meeting Link: ${meetingDetails.meet_url}
Meeting ID: ${meetingDetails.meeting_id}
${meetingDetails.meeting_password ? `Password: ${meetingDetails.meeting_password}` : ''}
        `.trim();
    }

    /**
     * Generate meeting instructions for email
     */
    public static generateMeetingInstructions(meetingDetails: MeetingDetails): string {
        return `
HƯỚNG DẪN THAM GIA CUỘC HỌP:

🔗 Link tham gia: ${meetingDetails.meet_url}
🆔 Meeting ID: ${meetingDetails.meeting_id}
${meetingDetails.meeting_password ? `🔐 Mật khẩu: ${meetingDetails.meeting_password}` : ''}

📱 CÁCH THAM GIA:
1. Nhấp vào link tham gia ở trên
2. Hoặc mở Google Meet và nhập Meeting ID
3. ${meetingDetails.meeting_password ? 'Nhập mật khẩu khi được yêu cầu' : 'Chờ chuyên gia chấp nhận bạn vào phòng'}

⏰ Vui lòng tham gia đúng giờ hẹn để có trải nghiệm tư vấn tốt nhất.

💡 LƯU Ý:
- Đảm bảo kết nối internet ổn định
- Chuẩn bị sẵn camera và microphone
- Tìm nơi yên tĩnh để tư vấn
- Chuẩn bị sẵn các câu hỏi bạn muốn tư vấn
        `.trim();
    }

    /**
     * Generate reminder text for email
     */
    public static generateReminderText(minutesBefore: number): string {
        return `
⏰ NHẮC NHỞ: Cuộc tư vấn của bạn sẽ bắt đầu trong ${minutesBefore} phút nữa!

Vui lòng chuẩn bị:
✅ Kiểm tra kết nối internet
✅ Test camera và microphone
✅ Tìm nơi yên tĩnh
✅ Chuẩn bị các câu hỏi cần tư vấn
        `.trim();
    }
}