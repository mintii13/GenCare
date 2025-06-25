export interface CreateFeedbackRequest {
  rating: number; // 1-5
  comment?: string;
}

export interface FeedbackData {
  rating: number;
  comment?: string;
  feedback_date: string;
}

export interface AppointmentInfo {
  consultant_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: {
    appointment_id: string;
    feedback: FeedbackData;
    appointment_info?: AppointmentInfo;
  };
  timestamp?: string;
}

export interface FeedbackStatsData {
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
}

export interface FeedbackStatsResponse {
  success: boolean;
  message: string;
  data?: FeedbackStatsData;
  timestamp?: string;
}

export interface ConsultantWithRating {
  _id: string;
  user_id: {
    _id: string;
    full_name: string;
    email: string;
    avatar?: string;
  };
  specialization: string;
  bio?: string;
  consultation_rating: number;
  total_consultations: number;
  experience_years: number;
  qualifications: string[];
  availability_status: 'available' | 'busy' | 'offline';
}

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export interface FeedbackFormData {
  rating: RatingValue;
  comment: string;
} 