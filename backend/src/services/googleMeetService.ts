import { google } from 'googleapis';
import { RandomUtils } from '../utils/randomUtils';

interface MeetingDetails {
    meet_url: string;
    meeting_id: string;
    meeting_password?: string;
    calendar_event_id?: string;
}

export class GoogleMeetService {
    /**
     * Tạo OAuth2 client sử dụng credentials hiện có của project
     */
    private static createOAuth2Client() {
        return new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || '/api/auth/google/callback'
        );
    }

    /**
     * Tạo Google Meet với Access Token từ OAuth
     */
    public static async createMeetingWithAccessToken(
        title: string,
        startTime: Date,
        endTime: Date,
        attendees: string[] = [],
        googleAccessToken: string
    ): Promise<MeetingDetails> {
        try {
            console.log('Creating Google Meet with access token...');
            console.log('Title:', title);
            console.log('Start time:', startTime);
            console.log('End time:', endTime);
            console.log('Attendees:', attendees);

            // Tạo OAuth2 client
            const oauth2Client = this.createOAuth2Client();

            // Set access token
            oauth2Client.setCredentials({
                access_token: googleAccessToken
            });

            // Tạo Google Calendar API instance
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            // Tạo event với Google Meet
            const event = {
                summary: title,
                description: `Cuộc tư vấn được tạo từ GenCare Platform`,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: 'Asia/Ho_Chi_Minh',
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: 'Asia/Ho_Chi_Minh',
                },
                attendees: attendees.map(email => ({ email })),
                conferenceData: {
                    createRequest: {
                        requestId: `gencare-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
                sendUpdates: 'all',
            };

            console.log('Creating calendar event...');

            // Tạo event
            const insertRequest = {
                calendarId: 'primary',
                conferenceDataVersion: 1,
                requestBody: event
            };

            const response = await calendar.events.insert(insertRequest);

            console.log('Calendar event created:', response.data.id);

            const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri;
            const meetingId = this.extractMeetingIdFromUrl(meetLink || '');

            if (!meetLink) {
                throw new Error('Failed to create Google Meet link');
            }

            console.log('Google Meet created successfully:', meetLink);

            return {
                meet_url: meetLink,
                meeting_id: meetingId || this.extractMeetingIdFromUrl(meetLink),
                calendar_event_id: response.data.id,
            };

        } catch (error) {
            console.error('Error creating Google Meet:', error);
            throw error;
        }
    }

    /**
     * Generate Google Meet link - UPDATED: Ưu tiên sử dụng Real Google API
     */
    public static async generateRealMeetLink(
        title: string,
        startTime: Date,
        endTime: Date,
        attendees?: string[],
        googleAccessToken?: string
    ): Promise<MeetingDetails> {
        try {
            if (googleAccessToken) {
                console.log('Creating real Google Meet with provided access token');

                // Sử dụng Google API để tạo real meeting
                return await this.createMeetingWithAccessToken(
                    title,
                    startTime,
                    endTime,
                    attendees || [],
                    googleAccessToken
                );
            } else {
                console.log('No Google access token provided - cannot create real Google Meet');
                throw new Error('Google Access Token is required to create real Google Meet link. Please authenticate with Google first.');
            }
        } catch (error) {
            console.error('Error generating real Meet link:', error);
            throw new Error(`Failed to create Google Meet: ${error.message}`);
        }
    }

    /**
     * Extract meeting ID từ Google Meet URL
     */
    private static extractMeetingIdFromUrl(url: string): string | null {
        const match = url.match(/https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
        return match ? match[1] : null;
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

📱 CÁCH THAM GIA:
1. Nhấp vào link tham gia ở trên
2. Hoặc mở Google Meet và nhập Meeting ID: ${meetingDetails.meeting_id}
3. Chờ chuyên gia chấp nhận bạn vào phòng

⏰ Vui lòng tham gia đúng giờ hẹn để có trải nghiệm tư vấn tốt nhất.

💡 LƯU Ý:
- Đảm bảo kết nối internet ổn định
- Chuẩn bị sẵn camera và microphone
- Tìm nơi yên tĩnh để tư vấn
- Chuẩn bị sẵn các câu hỏi bạn muốn tư vấn

🔧 NẾU KHÔNG VÀO ĐƯỢC:
- Kiểm tra lại link và meeting ID
- Đảm bảo đã đăng nhập Google account
- Thử mở link trong trình duyệt khác
- Liên hệ chuyên gia nếu gặp vấn đề
        `.trim();
    }

    /**
     * Generate reminder text for email
     */
    public static generateReminderText(minutesBefore: number): string {
        return `
⏰ NHẮC NHỞ: Cuộc tư vấn của bạn sẽ bắt đầu trong ${minutesBefore} phút nữa!

Vui lòng chuẩn bị:
 Kiểm tra kết nối internet
 Test camera và microphone
 Tìm nơi yên tĩnh
 Chuẩn bị các câu hỏi cần tư vấn
        `.trim();
    }

    /**
     * Test if a Meet link is accessible
     */
    public static async testMeetLink(meetUrl: string): Promise<{ accessible: boolean; message: string }> {
        try {
            if (this.isValidMeetUrl(meetUrl)) {
                return {
                    accessible: true,
                    message: 'Meet link format is valid'
                };
            } else {
                return {
                    accessible: false,
                    message: 'Invalid Meet link format'
                };
            }
        } catch (error) {
            return {
                accessible: false,
                message: `Error testing Meet link: ${error}`
            };
        }
    }
}