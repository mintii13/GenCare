import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export class GoogleAuthHelper {
    /**
     * Create JWT authentication for Google APIs
     */
    public static createJWTAuth(): JWT {
        if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            throw new Error('Google API credentials not configured. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in environment variables.');
        }

        const credentials = {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };

        return new google.auth.JWT(
            credentials.client_email,
            undefined,
            credentials.private_key,
            [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
            ]
        );
    }

    /**
     * Test Google API connection
     */
    public static async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const auth = this.createJWTAuth();
            const calendar = google.calendar({ version: 'v3', auth });

            // Try to list calendars to test connection
            await calendar.calendarList.list({ maxResults: 1 });

            return {
                success: true,
                message: 'Google Calendar API connection successful'
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Google Calendar API connection failed: ${error.message}`
            };
        }
    }

    /**
     * Check if Google API is properly configured
     */
    public static isConfigured(): boolean {
        return !!(
            process.env.GOOGLE_CLIENT_EMAIL &&
            process.env.GOOGLE_PRIVATE_KEY &&
            process.env.GOOGLE_PROJECT_ID
        );
    }
}