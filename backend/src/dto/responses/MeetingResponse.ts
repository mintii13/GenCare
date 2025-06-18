export interface MeetingInfoResponse {
    success: boolean;
    message: string;
    data?: {
        meeting_info: {
            meet_url: string;
            meeting_id: string;
            meeting_password?: string;
            created_at: Date;
            reminder_sent: boolean;
        };
        appointment_status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress';
        video_call_status: 'not_started' | 'in_progress' | 'ended';
        appointment_details?: {
            appointment_date: string;
            start_time: string;
            end_time: string;
            customer_name?: string;
            consultant_name?: string;
        };
    };
    timestamp?: string;
}

export interface MeetingActionResponse {
    success: boolean;
    message: string;
    data?: {
        appointment_id: string;
        action_performed: 'reminder_sent' | 'meeting_started' | 'meeting_completed';
        timestamp: string;
    };
    timestamp?: string;
}

export interface EmailNotificationResponse {
    success: boolean;
    message: string;
    email_sent?: boolean;
    recipient?: string;
    email_type?: 'confirmation' | 'reminder' | 'cancellation';
}