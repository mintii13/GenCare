import React, { useEffect, useState } from 'react';
import apiClient from '@/services/apiClient';
import { AlertCircle, BarChart3, CalendarCheck, Star, ThumbsDown, ThumbsUp } from 'lucide-react';

interface FeedbackStats {
  total_feedbacks: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface AppointmentStats {
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  completion_rate: number; // %
}

interface RecentFeedback {
  appointment_id: string;
  rating: number;
  comment?: string;
  feedback_date: string;
  customer_name: string;
}

interface PerformanceSummary {
  consultant_info: {
    consultant_id: string;
    name: string;
    specialization: string;
    experience_years: number;
  };
  feedback_stats: FeedbackStats;
  appointment_stats: AppointmentStats;
  recent_feedback: RecentFeedback[];
}

const ConsultationStats: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<any>('/consultants/my-performance');
        if (response.data?.success) {
          setSummary(response.data.data as PerformanceSummary);
        } else {
          setError(response.data?.message || 'Không thể tải dữ liệu');
        }
      } catch (err: any) {
        console.error('Error fetching performance summary:', err);
        setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center">
        <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
        <p className="text-red-600">{error || 'Không thể tải thống kê tư vấn'}</p>
      </div>
    );
  }

  const { appointment_stats, feedback_stats, recent_feedback, consultant_info } = summary;

  const ratingBarWidth = (rating: number) => {
    if (feedback_stats.total_feedbacks === 0) return '0%';
    const count = feedback_stats.rating_distribution[rating as 1 | 2 | 3 | 4 | 5];
    return `${(count / feedback_stats.total_feedbacks) * 100}%`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Thống Kê Tư Vấn</h1>
        <p className="text-gray-600">Tổng quan hiệu suất và đánh giá của bạn</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Appointments */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center space-x-4">
          <CalendarCheck className="w-8 h-8 text-primary-600" />
          <div>
            <p className="text-2xl font-semibold text-gray-900">{appointment_stats.total_appointments}</p>
            <p className="text-gray-600 text-sm">Tổng lịch hẹn</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center space-x-4">
          <ThumbsUp className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-2xl font-semibold text-gray-900">{appointment_stats.completed_appointments}</p>
            <p className="text-gray-600 text-sm">Hoàn thành</p>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center space-x-4">
          <ThumbsDown className="w-8 h-8 text-red-600" />
          <div>
            <p className="text-2xl font-semibold text-gray-900">{appointment_stats.cancelled_appointments}</p>
            <p className="text-gray-600 text-sm">Đã huỷ</p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center space-x-4">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <div>
            <p className="text-2xl font-semibold text-gray-900">{appointment_stats.completion_rate}%</p>
            <p className="text-gray-600 text-sm">Tỉ lệ hoàn thành</p>
          </div>
        </div>
      </div>

      {/* Rating overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average rating */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center space-x-4">
          <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
          <div>
            <p className="text-3xl font-bold text-gray-900">{feedback_stats.average_rating.toFixed(1)}</p>
            <p className="text-gray-600">Điểm trung bình ({feedback_stats.total_feedbacks} đánh giá)</p>
          </div>
        </div>

        {/* Rating distribution bars */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố đánh giá</h3>
          <div className="space-y-3">
            {[5,4,3,2,1].map(r => (
              <div key={r} className="flex items-center">
                <div className="w-12 flex items-center text-sm text-gray-600">
                  {r} <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 ml-1" />
                </div>
                <div className="flex-1 mx-4 bg-gray-200 rounded-full h-3">
                  <div className="bg-yellow-400 h-3 rounded-full" style={{ width: ratingBarWidth(r) }} />
                </div>
                <div className="w-10 text-right text-sm text-gray-600">
                  {feedback_stats.rating_distribution[r as 1|2|3|4|5]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent feedback */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phản hồi gần đây</h3>
        {recent_feedback.length === 0 ? (
          <p className="text-gray-600">Chưa có phản hồi.</p>
        ) : (
          <ul className="space-y-4">
            {recent_feedback.map(fb => (
              <li key={fb.appointment_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-gray-800">{fb.rating} / 5</span>
                  </div>
                  <span className="text-sm text-gray-500">{new Date(fb.feedback_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="text-gray-700 italic">"{fb.comment || 'Không có bình luận'}"</p>
                <p className="text-right text-sm text-gray-500 mt-1">— {fb.customer_name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default ConsultationStats; 