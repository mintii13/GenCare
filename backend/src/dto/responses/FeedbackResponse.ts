export interface FeedbackResponse {
    success: boolean;
    message: string;
    data?: {
        appointment_id: string;
        feedback: {
            rating: number;
            comment?: string;
            feedback_date: string;
        };
        appointment_info?: {
            consultant_name: string;
            appointment_date: string;
            start_time: string;
            end_time: string;
        };
    };
    timestamp?: string;
}

export interface FeedbackStatsResponse {
    success: boolean;
    message: string;
    data?: {
        consultant_id: string;
        consultant_name?: string;
        total_feedbacks: number;
        average_rating: number;
        rating_distribution: {
            1: number;
            2: number;
            3: number;
            4: number;
            5: number;
        };
        recent_feedbacks: Array<{
            appointment_id: string;
            rating: number;
            comment?: string;
            feedback_date: string;
            customer_name: string;
        }>;
    };
    timestamp?: string;
}