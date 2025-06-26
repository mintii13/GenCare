export interface SendReminderRequest {
    appointment_id: string;
    minutes_before?: number; // Default 15 minutes
}

export interface StartMeetingRequest {
    appointment_id: string;
}

export interface CompleteMeetingRequest {
    appointment_id: string;
    consultant_notes?: string;
    meeting_duration?: number; // in minutes
}