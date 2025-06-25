import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, MessageSquare, Calendar, Award, AlertCircle } from 'lucide-react';
import StarRating from '../../components/feedback/StarRating';
import FeedbackService from '../../services/feedbackService';
import { FeedbackStatsData } from '../../types/feedback';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ConsultantFeedbackDashboard: React.FC = () => {
  const [stats, setStats] = useState<FeedbackStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadFeedbackStats();
  }, []);

  const loadFeedbackStats = async () => {
    try {
      setLoading(true);
      // For now, we'll use a placeholder consultant ID
      // In a real app, this would come from the logged-in consultant's data
      const consultantId = 'current-consultant-id'; // TODO: Get from auth context
      
      const response = await FeedbackService.getConsultantFeedbackStats(consultantId);
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError('Không thể tải thống kê đánh giá');
      }
    } catch (err) {
      console.error('Error loading feedback stats:', err);
      setError('Lỗi khi tải thống kê đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const getRatingPercentage = (rating: number): number => {
    if (!stats || stats.total_feedbacks === 0) return 0;
    return (stats.rating_distribution[rating as keyof typeof stats.rating_distribution] / stats.total_feedbacks) * 100;
  };

  const getPerformanceLevel = (averageRating: number): { 
    level: string; 
    color: string; 
    description: string;
  } => {
    if (averageRating >= 4.5) {
      return {
        level: 'Xuất sắc',
        color: 'text-emerald-600 bg-emerald-100',
        description: 'Chất lượng tư vấn rất tốt'
      };
    } else if (averageRating >= 4.0) {
      return {
        level: 'Tốt',
        color: 'text-green-600 bg-green-100',
        description: 'Chất lượng tư vấn tốt'
      };
    } else if (averageRating >= 3.0) {
      return {
        level: 'Trung bình',
        color: 'text-yellow-600 bg-yellow-100',
        description: 'Có thể cải thiện thêm'
      };
    } else {
      return {
        level: 'Cần cải thiện',
        color: 'text-red-600 bg-red-100',
        description: 'Cần nâng cao chất lượng tư vấn'
      };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Lỗi tải dữ liệu</h3>
              <p className="text-red-600">{error || 'Không thể tải thống kê đánh giá'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const performance = getPerformanceLevel(stats.average_rating);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Đánh Giá
        </h1>
        <p className="text-gray-600">
          Thống kê và phân tích đánh giá từ bệnh nhân
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Feedbacks */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total_feedbacks}
              </p>
              <p className="text-gray-600">Tổng đánh giá</p>
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.average_rating.toFixed(1)}
              </p>
              <p className="text-gray-600">Điểm trung bình</p>
            </div>
          </div>
        </div>

        {/* Performance Level */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className={`text-sm font-medium px-2 py-1 rounded-full ${performance.color}`}>
                {performance.level}
              </p>
              <p className="text-gray-600 text-sm mt-1">{performance.description}</p>
            </div>
          </div>
        </div>

        {/* Satisfaction Rate */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total_feedbacks > 0 
                  ? Math.round(((stats.rating_distribution[4] + stats.rating_distribution[5]) / stats.total_feedbacks) * 100)
                  : 0
                }%
              </p>
              <p className="text-gray-600">Hài lòng (4-5⭐)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rating Distribution */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Phân bố đánh giá
          </h3>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center">
                <div className="flex items-center w-12">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 ml-1" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center w-20 justify-end">
                  <span className="text-sm text-gray-600">
                    {stats.rating_distribution[rating as keyof typeof stats.rating_distribution]}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({getRatingPercentage(rating).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Feedbacks */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Đánh giá gần đây
          </h3>
          {stats.recent_feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có đánh giá nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recent_feedbacks.slice(0, 5).map((feedback, index) => (
                <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {feedback.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(feedback.feedback_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </p>
                    </div>
                    <StarRating rating={feedback.rating} readonly size="sm" />
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      "{feedback.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insights & Recommendations */}
      {stats.total_feedbacks > 0 && (
        <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nhận xét và Đề xuất
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Điểm mạnh</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {stats.average_rating >= 4.0 && (
                  <li>• Duy trì chất lượng tư vấn tốt</li>
                )}
                {getRatingPercentage(5) >= 50 && (
                  <li>• Nhiều bệnh nhân rất hài lòng</li>
                )}
                {stats.total_feedbacks >= 10 && (
                  <li>• Có nhiều kinh nghiệm từ phản hồi</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cơ hội cải thiện</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {stats.average_rating < 4.0 && (
                  <li>• Cần nâng cao chất lượng tư vấn</li>
                )}
                {getRatingPercentage(1) + getRatingPercentage(2) > 20 && (
                  <li>• Giảm số lượng đánh giá thấp</li>
                )}
                {stats.total_feedbacks < 10 && (
                  <li>• Khuyến khích bệnh nhân đánh giá</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantFeedbackDashboard; 